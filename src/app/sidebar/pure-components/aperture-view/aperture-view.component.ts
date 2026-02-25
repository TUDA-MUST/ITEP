import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type Transducer, type TransducerModel } from 'src/app/store/store.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-aperture-view',
  templateUrl: './aperture-view.component.html',
  styleUrl: './aperture-view.component.scss',
})
export class ApertureViewComponent {
  readonly transducers = input<Transducer[]>([]);
  readonly transducerModel = input<TransducerModel>();

  readonly transducerDiameter = input<number>(0);
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
        left: Math.min(acc.left, t.pos.x - this.transducerDiameter() / 2),
        top: Math.max(acc.top, t.pos.y + this.transducerDiameter() / 2),
        right: Math.max(acc.right, t.pos.x + this.transducerDiameter() / 2),
        bottom: Math.min(acc.bottom, t.pos.y - this.transducerDiameter() / 2),
      }),
      initial,
    );
    const bbString = `${rawBB.left} ${-rawBB.top} ${rawBB.right - rawBB.left} ${rawBB.top - rawBB.bottom}`;
    return bbString;
  });
  readonly transducersMapped = computed(() =>
    this.transducers().map((t) => ({
      ...t,
      pos: { x: t.pos.x, y: -t.pos.y },
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
