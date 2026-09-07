import {
  createStorageBuffer,
  disposeStorageBuffer,
  updateStorageBuffer,
  type EngineContext,
  type StorageBuffer,
} from '@babylonjs/lite';

import { createExcitationBuffer, setExcitationElement } from '../../utils/excitationbuffer';
import { azElToUV } from '../../utils/uv';
import type { BeamformingState } from '../../store/beamforming.state';
import type { Transducer } from '../../store/store.service';

/**
 * Native Lite replacement for Babylon's `UniformBuffer`. The shader data is
 * storage-buffer backed because Lite's public ShaderMaterial API exposes
 * read-only storage bindings for application-sized arrays.
 */
export class LiteExcitationBuffer {
  readonly data = createExcitationBuffer();
  readonly storageBuffer: StorageBuffer;

  constructor(private readonly engine: EngineContext) {
    this.storageBuffer = createStorageBuffer(engine, this.data, 'excitation');
  }

  update(
    transducers: Transducer[],
    beamforming: BeamformingState | null,
    waveNumber: number | null,
  ): void {
    const beamformingUv = azElToUV(beamforming ?? { az: 0, el: 0 });

    this.data.fill(0);
    transducers.forEach((transducer, index) => {
      const phase =
        beamforming?.beamformingEnabled && waveNumber !== null
          ? waveNumber *
            ((beamformingUv.u ?? 0) * transducer.pos.x + (beamformingUv.v ?? 0) * transducer.pos.y)
          : 0;
      setExcitationElement(transducer.pos, phase, this.data, index);
    });

    updateStorageBuffer(this.engine, this.storageBuffer, this.data);
  }

  dispose(): void {
    disposeStorageBuffer(this.storageBuffer);
  }
}
