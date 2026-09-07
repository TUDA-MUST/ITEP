struct ExcitationElement {
  position: vec4<f32>,
  phasor: vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) r: vec3<f32>,
};

const RESULT_ASPECT_ELONGATION: i32 = 0;
const RESULT_ASPECT_AMPLITUDE: i32 = 1;

@fragment
fn mainFragment(input: VertexOutput) -> @location(0) vec4<f32> {
  var elongation = vec2<f32>(0.0, 0.0);

  for (var j = 0; j < shaderUniforms.numElements; j++) {
    let element = excitation[j];
    let distanceToElement = distance(element.position.xyz, input.r);
    let inverseDistanceSquared = pow(distanceToElement, -2.0);
    let argument = distanceToElement * shaderUniforms.k + element.phasor.x - shaderUniforms.globalPhase;
    elongation += vec2<f32>(cos(argument), sin(argument)) * element.phasor.y * inverseDistanceSquared;
  }

  if (shaderUniforms.viewmode == RESULT_ASPECT_ELONGATION) {
    let intensity = clamp(
      0.5 + (0.5 * elongation.x + 0.25) /
        (f32(shaderUniforms.numElements) * shaderUniforms.dynamicRange),
      0.0,
      1.0,
    );
    return textureSample(colormap, colormapSampler, vec2<f32>(intensity, shaderUniforms.elongationColormapY));
  }

  if (shaderUniforms.viewmode == RESULT_ASPECT_AMPLITUDE) {
    let magnitude = log(length(elongation) / f32(shaderUniforms.numElements)) / log(10.0);
    let intensity = clamp((magnitude + shaderUniforms.dynamicRange) / shaderUniforms.dynamicRange, 0.0, 1.0);
    return textureSample(colormap, colormapSampler, vec2<f32>(intensity, shaderUniforms.magnitudeColormapY));
  }

  let intensity = fract(atan2(elongation.y, elongation.x) / (2.0 * 3.141592653589793) + 1.0);
  return textureSample(colormap, colormapSampler, vec2<f32>(intensity, shaderUniforms.phaseColormapY));
}
