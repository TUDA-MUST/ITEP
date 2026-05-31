export const colormapTexturePath = 'assets/perceptual-colormaps.png';

export const colormapTextureRows = {
  viridis: 0,
  coolwarm: 1,
  twilightShifted: 2,
} as const;

export const colormapTextureRowCount = 3;

export const colormapTextureSampleY = (row: number): number =>
  (row + 0.5) / colormapTextureRowCount;

export const colormapTextureSampleRows = {
  viridis: colormapTextureSampleY(colormapTextureRows.viridis),
  coolwarm: colormapTextureSampleY(colormapTextureRows.coolwarm),
  twilightShifted: colormapTextureSampleY(colormapTextureRows.twilightShifted),
} as const;
