import type { Vector3Data } from '../core/vector';
import excitationBufferInclude from './excitation-buffer.wgsl';

export const excitationBufferMaxElements = 2048;
export const excitationBufferMaxElementsDefine = `#define MAX_ELEMENTS ${excitationBufferMaxElements}`;
export const excitationBufferElementSize = 8;

export interface ExcitationElement {
  pos: Vector3Data;
  phase: number;
  amplitude: number;
}

export { excitationBufferInclude };

export function createExcitationBuffer() {
  return new Float32Array(excitationBufferElementSize * excitationBufferMaxElements);
}

export function setExcitationElement(
  position: Vector3Data,
  phase: number,
  buffer: Float32Array,
  index: number,
) {
  const elementOffset = excitationBufferElementSize * index;
  buffer[elementOffset] = position.x;
  buffer[elementOffset + 1] = position.y;
  buffer[elementOffset + 2] = position.z;
  buffer[elementOffset + 3] = 0;

  buffer[elementOffset + 4] = phase; // phase shift [rad]
  buffer[elementOffset + 5] = 1; // area
  buffer[elementOffset + 6] = 0; // reserved
  buffer[elementOffset + 7] = 0; // reserved
}
