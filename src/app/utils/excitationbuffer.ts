import { type Vector3 } from '@babylonjs/core/Maths/math.vector';

export const excitationBufferMaxElements = 2048;
export const excitationBufferMaxElementsDefine = `#define MAX_ELEMENTS ${excitationBufferMaxElements}`;
export const excitationBufferElementSize = 8;

export interface ExcitationElement {
    pos: Vector3;
    phase: number;
    amplitude: number;
  }

export const excitationBufferInclude = /* wgsl */`
  struct ExcitationElement { // size per element: 8
    position : vec4<f32>, // offset 0
    phasor : vec4<f32>, // 0: amplitude, 1: area, 2: delay, 3: dummy // Offset  16
  };

  struct ExcitationBuffer { 
    elements: array<ExcitationElement, 2048>,
  };

  var<uniform> excitation: ExcitationBuffer;
`;

export function createExcitationBuffer() {
    return new Float32Array(excitationBufferElementSize * excitationBufferMaxElements);
}

export function setExcitationElement(position : Vector3, phase: number, buffer: Float32Array, index : number) {
    const elementOffset = excitationBufferElementSize * index;
    position.toArray(buffer, elementOffset);
    
    buffer[elementOffset + 4] = phase; // amplitude
    buffer[elementOffset + 5] = 1; // area
    buffer[elementOffset + 6] = 0; // phase
    buffer[elementOffset + 7] = 0; // zero  
}