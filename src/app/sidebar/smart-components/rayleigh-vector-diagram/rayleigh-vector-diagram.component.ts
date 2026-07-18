import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { calcK } from 'src/app/core/environment';
import { StoreService } from 'src/app/store/store.service';
import { azElToUV } from 'src/app/utils/uv';
import { rayleighVectorColor } from 'src/app/utils/rayleigh-vector-colors';

interface ComplexPoint {
  x: number;
  y: number;
}

interface VectorSegment {
  start: ComplexPoint;
  end: ComplexPoint;
  color: string;
}

@Component({
  selector: 'app-rayleigh-vector-diagram',
  templateUrl: './rayleigh-vector-diagram.component.html',
  styleUrl: './rayleigh-vector-diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RayleighVectorDiagramComponent {
  private readonly store = inject(StoreService);

  readonly diagram = computed(() => {
    const transducers = this.store.transducers();
    const probe = this.store.probePoint();
    const env = this.store.arrayConfig().environment;
    const globalPhase = this.store.globalPhase();
    const beamforming = this.store.beamforming();

    const k = calcK(env);
    const bfuv = azElToUV(beamforming);

    let sumRe = 0;
    let sumIm = 0;

    const chain: VectorSegment[] = [];
    let tail: ComplexPoint = { x: 0, y: 0 };
    let maxRadius = 1e-9;

    transducers.forEach((transducer, index) => {
      const dx = transducer.pos.x - probe.x;
      const dy = transducer.pos.y - probe.y;
      const dz = transducer.pos.z - probe.z;
      const distance = Math.max(Math.hypot(dx, dy, dz), 1e-9);

      const beamPhase = beamforming.beamformingEnabled
        ? k * ((bfuv.u ?? 0) * transducer.pos.x + (bfuv.v ?? 0) * transducer.pos.y)
        : 0;

      const arg = distance * k + beamPhase - globalPhase;
      const amplitude = Math.pow(distance, -2);

      const re = Math.cos(arg) * amplitude;
      const im = Math.sin(arg) * amplitude;

      sumRe += re;
      sumIm += im;

      const head = { x: tail.x + re, y: tail.y + im };
      maxRadius = Math.max(maxRadius, Math.hypot(head.x, head.y), Math.hypot(tail.x, tail.y));

      chain.push({
        start: tail,
        end: head,
        color: rayleighVectorColor(index).css,
      });

      tail = head;
    });

    const scale = 0.9 / maxRadius;

    const scaledChain = chain.map((segment) => ({
      ...segment,
      start: {
        x: segment.start.x * scale,
        y: segment.start.y * scale,
      },
      end: {
        x: segment.end.x * scale,
        y: segment.end.y * scale,
      },
    }));

    const sum = {
      x: sumRe * scale,
      y: sumIm * scale,
    };

    const magnitude = Math.hypot(sumRe, sumIm);
    const phase = Math.atan2(sumIm, sumRe);

    return {
      segments: scaledChain,
      sum,
      magnitude,
      phase,
      elements: transducers.length,
    };
  });

  readonly chainPath = computed(() => {
    const segments = this.diagram().segments;
    if (segments.length === 0) {
      return '';
    }

    const first = segments[0].start;
    const commands = [`M ${first.x} ${-first.y}`];

    segments.forEach((segment) => {
      commands.push(`L ${segment.end.x} ${-segment.end.y}`);
    });

    return commands.join(' ');
  });

  readonly elementsLabel = computed(() => `Elements: ${this.diagram().elements}`);
  readonly magnitudeLabel = computed(() => `|sum|: ${this.diagram().magnitude.toExponential(3)}`);
  readonly phaseLabel = computed(() => `arg(sum): ${this.diagram().phase.toFixed(3)} rad`);
}
