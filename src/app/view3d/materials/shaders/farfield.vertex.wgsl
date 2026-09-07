struct ExcitationElement { position: vec4<f32>, phasor: vec4<f32>, };

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) intensity: f32,
  @location(2) worldPosition: vec3<f32>,
};

const PI = 3.141592653589793;
const SQRT_2_OVER_PI = sqrt(2.0 / PI);

fn j1Approximation(x: f32) -> f32 {
  if (x <= 3.0) {
    let halfX = 0.5 * x;
    let r = halfX * halfX;
    return halfX * fma(fma(fma(-1.0 / 144.0, r, 1.0 / 12.0), r, -0.5), r, 1.0);
  }
  return SQRT_2_OVER_PI * inverseSqrt(x) * cos(x - 0.75 * PI);
}

fn jinc(u: f32) -> f32 {
  let absoluteU = abs(u);
  if (absoluteU < 1e-3) {
    let uSquared = absoluteU * absoluteU;
    return fma(uSquared, fma(uSquared, 1.0 / 192.0, -0.125), 1.0);
  }
  return 2.0 * j1Approximation(absoluteU) / absoluteU;
}

fn sinc(u: f32) -> f32 {
  let absoluteU = abs(u);
  if (absoluteU < 1e-3) {
    let uSquared = absoluteU * absoluteU;
    return fma(uSquared, fma(uSquared, 1.0 / 120.0, -1.0 / 6.0), 1.0);
  }
  return sin(absoluteU) / absoluteU;
}

fn elementFactor(uv: vec2<f32>) -> f32 {
  switch (shaderUniforms.transducerType) {
    case 1: { return jinc(shaderUniforms.ka * min(length(uv), 0.9999999)); }
    case 2: { return sinc(0.5 * shaderUniforms.ka * uv.x) * sinc(0.5 * shaderUniforms.kb * uv.y); }
    default: { return 1.0; }
  }
}

@vertex
fn mainVertex(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  var result = vec2<f32>(0.0, 0.0);
  for (var i = 0; i < shaderUniforms.numElements; i++) {
    let element = excitation[i];
    let argumentVector = element.position.xy * input.uv;
    let argument = shaderUniforms.k * (argumentVector.x + argumentVector.y) - element.phasor.x;
    result += vec2<f32>(cos(argument), sin(argument));
  }

  let amplitude = length(result);
  let decibels = 10.0 * log((amplitude * elementFactor(input.uv)) / f32(shaderUniforms.numElements));
  let intensity = clamp((decibels + shaderUniforms.dynamicRange) / shaderUniforms.dynamicRange, 0.0, 1.0);
  let positionSquared = input.position * input.position;
  let direction = vec3<f32>(
    input.position.xy,
    sqrt(max(0.0, 1.0 - positionSquared.x - positionSquared.y)),
  );
  out.worldPosition = direction * intensity * 0.02;
  out.position = shaderSystem.worldViewProjection * vec4<f32>(out.worldPosition, 1.0);
  out.uv = input.uv;
  out.intensity = intensity;
  return out;
}
