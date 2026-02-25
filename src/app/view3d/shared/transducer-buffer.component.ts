import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
  type OnDestroy,
  signal,
} from '@angular/core';

import { UniformBuffer } from '@babylonjs/core/Materials/uniformBuffer';
import { type Scene } from '@babylonjs/core/scene';
import {
  createExcitationBuffer,
  excitationBufferMaxElements,
  setExcitationElement,
} from '../../utils/excitationbuffer';
import { VEC4_ELEMENT_COUNT } from '../../utils/webgl.utils';
import { BabylonConsumer } from '../interfaces/lifecycle';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { type BeamformingState } from 'src/app/store/beamforming.state';
import { type Transducer } from 'src/app/store/store.service';
import { diff } from 'src/app/utils/utils';
import { azElToUV } from 'src/app/utils/uv';

export interface Textures {
  viridis: Texture;
  coolwarm: Texture;
}

export interface OnTransducerBufferCreated {
  ngxSceneAndBufferCreated(
    scene: Scene,
    buffer: UniformBuffer,
    textures: Textures
  ): void;
}

export abstract class TransducerBufferConsumer implements OnTransducerBufferCreated {
  abstract ngxSceneAndBufferCreated(scene: Scene, buffer: UniformBuffer, textures: Textures): void;
}

export const implementsOnTransducerBufferCreated = (
  candidate: unknown
): candidate is OnTransducerBufferCreated =>
  typeof candidate === 'object' &&
  candidate !== null &&
  'ngxSceneAndBufferCreated' in candidate;

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transducer-buffer',
  template: '<ng-content/>',
  standalone: true,
  providers: [{provide: BabylonConsumer, useExisting: forwardRef(() => TransducerBufferComponent)}],
})
export class TransducerBufferComponent extends BabylonConsumer implements OnDestroy {
  destroyRef = inject(DestroyRef);

  readonly transducers = input<Transducer[] | null>(null);
  readonly beamforming = input<BeamformingState | null>(null);
  readonly k = input<number | null>(null);

  readonly consumers = contentChildren(TransducerBufferConsumer);

  private uniformExcitationBuffer: UniformBuffer;
  private textures: Textures;
  public readonly scene = signal<Scene | null>(null);

  async ngxSceneCreated(scene: Scene): Promise<void> {
    this.uniformExcitationBuffer = new UniformBuffer(scene.getEngine());
    // Babylons only supports element sizes of 1,2,3,4 and 16.
    // Use 4 here, although it is 8 in reality (VEC4_ELEMENT_COUNT * 2) and multiply the number
    // of elements by 2 to correct the final size:
    // 8 * maxElementSize becomes 4 * maxElementSize * 2
    this.uniformExcitationBuffer.addUniform(
      'elements',
      VEC4_ELEMENT_COUNT /* *2 */,
      excitationBufferMaxElements * 2
    );

    const textures = ['assets/viridis.png', 'assets/coolwarm.png'];
    const tex = await Promise.all(
      textures.map((txpath) => {
        return new Promise((resolve, _reject) => {
          const tex = new Texture(
            txpath,
            scene,
            undefined,
            undefined,
            undefined,
            () => {
              tex.wrapU = Texture.CLAMP_ADDRESSMODE;
              resolve(tex);
            }
          );
        });
      })
    );

    this.textures = {
      viridis: tex[0] as Texture,
      coolwarm: tex[1] as Texture,
    };

    this.scene.set(scene);

    this.updateBuffer(this.transducers() ?? [], null);
  }

  updateRenderers = (() => {
    let prev: TransducerBufferConsumer[] = [];
    return effect(() => {
      const next = this.consumers();
      const scene = this.scene();
      if (scene) {
      const { added } = diff(prev, next);
        added.forEach((consumer) => {
          if (implementsOnTransducerBufferCreated(consumer)) {
            consumer.ngxSceneAndBufferCreated(
              scene,
              this.uniformExcitationBuffer,
              this.textures
            );
          }
        });
        prev = [...next];
      }
    });
  })();

  update = effect(() => {
    const transducers = this.transducers();
    const beamforming = this.beamforming();
    if (this.uniformExcitationBuffer && transducers) {
      this.updateBuffer(transducers, beamforming);
    }
  });

  ngOnDestroy(): void {
    if (this.uniformExcitationBuffer) {
      this.uniformExcitationBuffer.dispose();
    }
  }

  updateBuffer(transducers: Transducer[], bf: BeamformingState | null): void {
    if (this.uniformExcitationBuffer) {
      const bfuv = azElToUV(bf ?? { az: 0, el: 0 });

      const excitationBuffer = transducers.reduce(
        (buffer, transducer, index) => {
          const phase = bf?.beamformingEnabled ? (this.k() ?? 700) * ((bfuv.u ?? 0) * transducer.pos.x + (bfuv.v ?? 0) * transducer.pos.y) : 0;
          setExcitationElement(transducer.pos, phase, buffer, index);
          return buffer;
        },
        createExcitationBuffer()
      );

      this.uniformExcitationBuffer.updateUniformArray(
        'elements',
        excitationBuffer,
        excitationBuffer.length
      );
      this.uniformExcitationBuffer.update();
    }
  }
}
