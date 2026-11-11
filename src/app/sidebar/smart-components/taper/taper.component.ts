import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel, MatInput, MatSuffix } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { GraphicComponent, GridComponent, MarkLineComponent } from 'echarts/components';
import { StoreService } from '../../../store/store.service';
import type { TaperConfig } from '../../../core/taper';

echarts.use([LineChart, CanvasRenderer, GraphicComponent, GridComponent, MarkLineComponent]);

@Component({
  selector: 'app-taper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatSuffix, MatSelect, MatOption],
  template: `
    <div [formGroup]="form" class="controls">
      <mat-form-field>
        <mat-label>Amplitude taper</mat-label>
        <mat-select formControlName="type">
          <mat-option value="uniform">Uniform</mat-option>
          <mat-option value="taylor">Taylor</mat-option>
          <mat-option value="chebyshev">Dolph–Chebyshev</mat-option>
        </mat-select>
      </mat-form-field>
      @if (store.taper().type !== 'uniform') {
        <mat-form-field>
          <mat-label>Spatial strategy</mat-label>
          <mat-select formControlName="strategy">
            <mat-option value="rectangular">Rectangular</mat-option>
            <mat-option value="radial">Radial</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Design SLL</mat-label>
          <input
            matInput
            type="number"
            formControlName="sll"
            min="-80"
            max="-15"
            step="1"
            aria-describedby="taper-sll-help"
          />
          <span matSuffix>dB</span>
        </mat-form-field>
        @if (store.taper().type === 'taylor') {
          <details>
            <summary>Advanced Taylor settings</summary>
            <mat-form-field>
              <mat-label>Near-in sidelobes (nbar)</mat-label>
              <input matInput type="number" formControlName="nbar" min="2" max="10" step="1" />
            </mat-form-field>
          </details>
        }
        <p id="taper-sll-help">
          Design SLL sets the window parameter (−80 to −15 dB). Achieved SLL depends on geometry and
          steering.
        </p>
        @if (ringWarning()) {
          <p>
            Radial tapering gives this ring equal weights and does not change its normalized
            pattern.
          </p>
        }
        @if (store.taper().sll < -30) {
          <p>The design marker is below the visible range. Use the numeric input to adjust it.</p>
        }
      }
    </div>
    <mat-form-field>
      <mat-label>Preview cut</mat-label>
      <mat-select [value]="plane()" (selectionChange)="plane.set($event.value)">
        <mat-option value="az">AZ</mat-option>
        <mat-option value="el">EL</mat-option>
      </mat-select>
    </mat-form-field>
    <div #plot class="plot" role="img" [attr.aria-label]="description()"></div>
    <p>{{ description() }}</p>
  `,
  styles: `
    :host,
    .controls {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .plot {
      height: 240px;
      width: 100%;
    }
    p {
      font-size: 0.85rem;
      margin: 0 0 12px;
    }
    details {
      margin-bottom: 12px;
    }
  `,
})
export class TaperComponent implements AfterViewInit {
  readonly store = inject(StoreService);
  private readonly destroyRef = inject(DestroyRef);
  readonly plot = viewChild.required<ElementRef<HTMLElement>>('plot');
  readonly plane = signal<'az' | 'el'>('az');
  private readonly chart = signal<echarts.ECharts | null>(null);
  private pendingFrame: number | null = null;
  private pendingSll = -30;
  readonly form = inject(FormBuilder).nonNullable.group({
    type: ['uniform' as TaperConfig['type']],
    strategy: ['rectangular' as TaperConfig['strategy']],
    sll: [-30, [Validators.required, Validators.min(-80), Validators.max(-15)]],
    nbar: [
      4,
      [Validators.required, Validators.min(2), Validators.max(10), Validators.pattern(/^\d+$/)],
    ],
  });
  readonly ringWarning = computed(
    () =>
      this.store.arrayConfig().config.type === 'circular' &&
      this.store.taper().strategy === 'radial',
  );
  readonly description = computed(() => {
    const sll = this.store.kpis()[this.plane()].slr;
    return `${this.plane().toUpperCase()} achieved SLL: ${sll === null ? 'unavailable' : sll.toFixed(1) + ' dB'}.`;
  });

  constructor() {
    effect(() => this.form.patchValue(this.store.taper(), { emitEvent: false }));
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.form.valid) this.store.setTaper(this.form.getRawValue());
    });
    effect(() => {
      const chart = this.chart();
      if (!chart) return;
      const plane = this.plane();
      const peak = this.store.kpis()[plane].maxl || 1;
      const taper = this.store.taper();
      chart.setOption({
        series: [
          {
            id: 'pattern',
            data: this.store
              .crossPattern()
              .map((point) => [
                point.angle,
                20 * Math.log10(Math.max(point[plane].abs() / peak, 1e-12)),
              ]),
            markLine: { data: taper.type === 'uniform' ? [] : [{ yAxis: taper.sll }] },
          },
        ],
      });
      this.updateHandle(chart);
    });
    this.destroyRef.onDestroy(() => {
      if (this.pendingFrame !== null) cancelAnimationFrame(this.pendingFrame);
    });
  }

  private updateHandle(chart: echarts.ECharts): void {
    const taper = this.store.taper();
    const visible = taper.type !== 'uniform' && taper.sll >= -30;
    const position = chart.convertToPixel({ gridIndex: 0 }, [75, taper.sll]);
    const onDrag = (y: number) => {
      const value = chart.convertFromPixel({ gridIndex: 0 }, [position[0], y])[1];
      this.pendingSll = Math.round(Math.max(-30, Math.min(-15, value)) * 10) / 10;
      if (this.pendingFrame === null)
        this.pendingFrame = requestAnimationFrame(() => {
          this.pendingFrame = null;
          this.store.setTaper({ sll: this.pendingSll });
        });
    };
    chart.setOption({
      graphic: [
        {
          id: 'sll-handle',
          type: 'circle',
          x: position[0],
          y: position[1],
          shape: { r: 12 },
          invisible: !visible,
          silent: !visible,
          draggable: 'vertical',
          cursor: 'ns-resize',
          z: 100,
          style: { fill: '#ffbd69', stroke: '#222', lineWidth: 2 },
          ondrag: function (this: { y: number }) {
            onDrag(this.y);
          },
        },
      ],
    });
  }

  ngAfterViewInit(): void {
    const chart = echarts.init(this.plot().nativeElement);
    chart.setOption({
      animation: false,
      grid: { left: 44, right: 16, top: 24, bottom: 32 },
      xAxis: {
        type: 'value',
        min: -90,
        max: 90,
        axisLabel: { color: '#e6e1e6', formatter: '{value}°' },
      },
      yAxis: {
        type: 'value',
        min: -30,
        max: 0,
        name: 'Relative amplitude / dB',
        nameTextStyle: { color: '#e6e1e6' },
        axisLabel: { color: '#e6e1e6' },
      },
      series: [
        {
          id: 'pattern',
          type: 'line',
          showSymbol: false,
          data: [],
          markLine: {
            symbol: ['none', 'none'],
            lineStyle: { color: '#ffbd69', type: 'dashed' },
            label: { formatter: 'Design {c} dB', position: 'insideStartTop' },
            data: [],
          },
        },
      ],
    });
    this.chart.set(chart);
    const observer = new ResizeObserver(() => {
      chart.resize();
      this.updateHandle(chart);
    });
    observer.observe(this.plot().nativeElement);
    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      chart.dispose();
    });
  }
}
