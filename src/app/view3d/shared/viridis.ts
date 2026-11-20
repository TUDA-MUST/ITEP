// Viridis RGB anchors at evenly spaced amplitudes from 0 to 1.
const colors = [
  [68, 1, 84],
  [71, 44, 122],
  [59, 82, 139],
  [44, 114, 142],
  [33, 145, 140],
  [40, 174, 128],
  [94, 201, 98],
  [173, 220, 48],
  [253, 231, 37],
];

export function viridis(amplitude: number): number[] {
  const position = Math.max(0, Math.min(1, amplitude)) * (colors.length - 1);
  const index = Math.floor(position);
  const fraction = position - index;
  const left = colors[index];
  const right = colors[Math.min(index + 1, colors.length - 1)];
  return left.map((value, channel) => (value + fraction * (right[channel] - value)) / 255);
}

// Use the same anchors for the UI legend and rendered element colors.
export const viridisGradient = `linear-gradient(to top, ${colors
  .map((color) => `rgb(${color.join(', ')})`)
  .join(', ')})`;
