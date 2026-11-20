import { expect, it } from 'vitest';
import { createExcitationBuffer, setExcitationElement } from './excitationbuffer';

it('packs taper amplitude into the field and export shader weight slot', () => {
  const buffer = createExcitationBuffer();
  setExcitationElement({ x: 1, y: 2, z: 3 }, 0.5, buffer, 1, 0.25);
  expect(Array.from(buffer.slice(8, 16))).toEqual([1, 2, 3, 0, 0.5, 0.25, 0, 0]);
  setExcitationElement({ x: 0, y: 0, z: 0 }, 0, buffer, 0);
  expect(buffer[5]).toBe(1);
});
