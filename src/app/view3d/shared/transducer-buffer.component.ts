import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  type OnDestroy,
  signal,
} from '@angular/core';

import { UniformBuffer } from '@babylonjs/core/Materials/uniformBuffer';
import type { Scene } from '@babylonjs/core/scene';
import {
  createExcitationBuffer,
  excitationBufferMaxElements,
  setExcitationElement,
} from '../../utils/excitationbuffer';
import { VEC4_ELEMENT_COUNT } from '../../utils/webgl.utils';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import type { BeamformingState } from 'src/app/store/beamforming.state';
import type { Transducer } from 'src/app/store/store.service';
import { azElToUV } from 'src/app/utils/uv';
import { colormapTexturePath } from './colormap-texture';
import { BabylonJSViewDirective } from '../smart-components/babylon-jsview/babylon-jsview.directive';

export interface Textures {
  colormaps: Texture;
}

export interface BufferContext {
  scene: Scene;
  buffer: UniformBuffer;
  textures: Textures;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transducer-buffer',
  template: '<ng-content/>',
})
export class TransducerBufferComponent implements OnDestroy {
  private readonly babylonView = inject(BabylonJSViewDirective);

  readonly transducers = input<Transducer[] | null>(null);
  readonly beamforming = input<BeamformingState | null>(null);
  readonly k = input<number | null>(null);

  private uniformExcitationBuffer: UniformBuffer;
  public readonly bufferContext = signal<BufferContext | null>(null);

  private readonly initEffect = effect(() => {
    const scene = this.babylonView.scene();
    if (!scene) return;
    this.uniformExcitationBuffer = new UniformBuffer(scene.getEngine());
    // Babylons only supports element sizes of 1,2,3,4 and 16.
    // Use 4 here, although it is 8 in reality (VEC4_ELEMENT_COUNT * 2) and multiply the number
    // of elements by 2 to correct the final size:
    // 8 * maxElementSize becomes 4 * maxElementSize * 2
    this.uniformExcitationBuffer.addUniform(
      'elements',
      VEC4_ELEMENT_COUNT /* *2 */,
      excitationBufferMaxElements * 2,
    );
    new Promise<Texture>((resolve) => {
      const texture = new Texture(colormapTexturePath, scene, true, false, undefined, () => {
        texture.wrapU = Texture.CLAMP_ADDRESSMODE;
        texture.wrapV = Texture.CLAMP_ADDRESSMODE;
        resolve(texture);
      });
    }).then((colormaps) => {
      this.bufferContext.set({
        scene,
        buffer: this.uniformExcitationBuffer,
        textures: { colormaps },
      });
      this.updateBuffer(this.transducers() ?? [], null);
    });
  });

  private readonly updateEffect = effect(() => {
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

      const excitationBuffer = transducers.reduce((buffer, transducer, index) => {
        const phase = bf?.beamformingEnabled
          ? (this.k() ?? 700) *
            ((bfuv.u ?? 0) * transducer.pos.x + (bfuv.v ?? 0) * transducer.pos.y)
          : 0;
        setExcitationElement(transducer.pos, phase, buffer, index);
        return buffer;
      }, createExcitationBuffer());

      this.uniformExcitationBuffer.updateUniformArray(
        'elements',
        excitationBuffer,
        excitationBuffer.length,
      );
      this.uniformExcitationBuffer.update();
    }
  }
}
