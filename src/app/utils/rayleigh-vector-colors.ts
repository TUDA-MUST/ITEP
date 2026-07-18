export interface RayleighVectorColor {
  r: number;
  g: number;
  b: number;
  css: string;
}

const goldenAngle = 137.50776405003785;
const initialHue = 200;
const saturation = 0.7;
const value = 0.95;

const hsvToRgb = (hue: number, saturation: number, value: number) => {
  const chroma = value * saturation;
  const hueSector = (((hue % 360) + 360) % 360) / 60;
  const secondLargest = chroma * (1 - Math.abs((hueSector % 2) - 1));
  const match = value - chroma;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSector < 1) {
    [red, green] = [chroma, secondLargest];
  } else if (hueSector < 2) {
    [red, green] = [secondLargest, chroma];
  } else if (hueSector < 3) {
    [green, blue] = [chroma, secondLargest];
  } else if (hueSector < 4) {
    [green, blue] = [secondLargest, chroma];
  } else if (hueSector < 5) {
    [red, blue] = [secondLargest, chroma];
  } else {
    [red, blue] = [chroma, secondLargest];
  }

  return { r: red + match, g: green + match, b: blue + match };
};

export const rayleighVectorColor = (index: number): RayleighVectorColor => {
  const { r, g, b } = hsvToRgb(initialHue + index * goldenAngle, saturation, value);
  const toByte = (channel: number) => Math.round(channel * 255);

  return {
    r,
    g,
    b,
    css: `rgb(${toByte(r)} ${toByte(g)} ${toByte(b)})`,
  };
};
