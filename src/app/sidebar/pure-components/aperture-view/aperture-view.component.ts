import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { viridis, viridisGradient } from 'src/app/view3d/shared/viridis';
import type { VoronoiCell } from 'src/app/core/voronoi';
import type { TransducerType } from 'src/app/core/transducer';
import type { Transducer } from 'src/app/store/store.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-aperture-view',
  templateUrl: './aperture-view.component.html',
  styleUrl: './aperture-view.component.scss',
})
export class ApertureViewComponent {
  // A visualization supplies both its value mapping and legend metadata.
  readonly visualization = input({
    label: 'Relative amplitude',
    min: '0',
    max: '1',
    gradient: viridisGradient,
    value: (element: Transducer) => Math.abs(element.amplitude ?? 1),
    color: (value: number) =>
      `rgb(${viridis(value)
        .map((channel) => Math.round(channel * 255))
        .join(', ')})`,
  });
  readonly hoveredValue = signal<number | null>(null);
  readonly hoveredPosition = computed(() => {
    const value = this.hoveredValue();
    const { min, max } = this.visualization();
    return value === null
      ? null
      : Math.max(0, Math.min(100, (100 * (value - Number(min))) / (Number(max) - Number(min))));
  });
  readonly cells = input<readonly VoronoiCell[]>([]);
  readonly highlightedCellIndices = input<ReadonlySet<number> | null>(null);
  readonly cellPaths = computed(() =>
    this.cells().map((cell) => ({
      points: cell.polygon.map((p) => `${p.x},${-p.y}`).join(' '),
      label: `${cell.indices.map((i) => this.transducers()[i]?.name).join(', ')}: ${(cell.area * 1e6).toPrecision(4)} mm²`,
    })),
  );
  readonly transducers = input<Transducer[]>([]);
  readonly transducerModel = input<TransducerType>();

  readonly transducerDimensions = computed(() => {
    const model = this.transducerModel();
    if (!model) return { width: 0, height: 0 };
    switch (model.type) {
      case 'Piston':
        return { width: model.diameter, height: model.diameter };
      case 'Rectangular':
        return { width: model.width, height: model.height };
      case 'Point':
        return { width: 0, height: 0 };
    }
  });
  readonly pistonRadius = computed(() => {
    const model = this.transducerModel();
    return model?.type === 'Piston' ? model.diameter / 2 : 0;
  });
  readonly arrayDiameter = input<number | null>(null);
  readonly bb = computed(() => {
    const dia = this.arrayDiameter();

    const initial =
      dia === null
        ? { left: Infinity, top: -Infinity, right: -Infinity, bottom: Infinity }
        : {
            left: -dia / 2 - 0.001,
            top: dia / 2 + 0.001,
            right: dia / 2 + 0.001,
            bottom: -dia / 2 - 0.001,
          };

    const rawBB = this.transducers().reduce(
      (acc, t) => ({
        left: Math.min(acc.left, t.pos.x - this.transducerDimensions().width / 2),
        top: Math.max(acc.top, t.pos.y + this.transducerDimensions().height / 2),
        right: Math.max(acc.right, t.pos.x + this.transducerDimensions().width / 2),
        bottom: Math.min(acc.bottom, t.pos.y - this.transducerDimensions().height / 2),
      }),
      initial,
    );

    if ([rawBB.left, rawBB.top, rawBB.right, rawBB.bottom].some((v) => !Number.isFinite(v))) {
      return '0 0 0 0';
    }

    const bbString = `${rawBB.left} ${-rawBB.top} ${rawBB.right - rawBB.left} ${rawBB.top - rawBB.bottom}`;
    return bbString;
  });
  readonly transducersMapped = computed(() =>
    this.transducers().map((t) => ({
      ...t,
      pos: { x: t.pos.x, y: -t.pos.y },
      value: this.visualization().value(t),
      color: this.visualization().color(this.visualization().value(t)),
      label: `${t.name}: ${this.visualization().label} ${this.visualization().value(t).toFixed(3)}`,
    })),
  );
  readonly crossSize = computed(() => {
    const initial = { left: Infinity, top: -Infinity, right: -Infinity, bottom: Infinity };

    const rawBB = this.transducers().reduce(
      (acc, t) => ({
        left: Math.min(acc.left, t.pos.x),
        top: Math.max(acc.top, t.pos.y),
        right: Math.max(acc.right, t.pos.x),
        bottom: Math.min(acc.bottom, t.pos.y),
      }),
      initial,
    );

    return Math.max(rawBB.right - rawBB.left, rawBB.top - rawBB.bottom, 0.001) * 0.05;
  });
}
