#include<ExcitationBuffer>

var colormapSampler : sampler;
var colormapTexture : texture_2d<f32>;
uniform globalPhase : f32;

uniform k : f32;
uniform omega : f32;

uniform viewmode : i32;
uniform dynamicRange : f32;
uniform elongationColormapY : f32;
uniform magnitudeColormapY : f32;
uniform phaseColormapY : f32;

uniform numElements : i32;

varying r : vec3<f32>;

@fragment
fn main(input : FragmentInputs) -> FragmentOutputs {
  var elongation : vec2<f32> = vec2<f32>(0.0,0.0); // Complex number

  for (var j = 0; j < uniforms.numElements; j++) {
    let elm = excitation.elements[j];
    let d = distance(elm.position.xyz, fragmentInputs.r);
    let oodd = pow(d,-2.0);

    let amplitude = 1.0;
    let area = elm.phasor.y;
    // elm.phasor.x is a phase shift [rad]. Keep it in phase space so a
    // zero excitation frequency does not require dividing by omega.
    let argz = (d*uniforms.k + elm.phasor.x - uniforms.globalPhase);
    elongation += vec2(cos(argz), sin(argz))*amplitude*area*oodd;
  }

  // glFragColor = vec4(.5 + elongation.x, .5-elongation.x, 0.5,1);
  if (uniforms.viewmode == 0) { // Elongation
    let intensity = saturate(0.5 + (.5*elongation.x + .25) / (f32(uniforms.numElements)*uniforms.dynamicRange));
    fragmentOutputs.color = textureSample(
      colormapTexture,
      colormapSampler,
      vec2<f32>(intensity, uniforms.elongationColormapY)
    );
  } else if (uniforms.viewmode == 1) { // Magnitude
    let magnitude = log(length(elongation) / f32(uniforms.numElements))/log(10.0f);
    let intensity = saturate((magnitude + uniforms.dynamicRange) / uniforms.dynamicRange);
    fragmentOutputs.color = textureSample(
      colormapTexture,
      colormapSampler,
      vec2<f32>(intensity, uniforms.magnitudeColormapY)
    );
  } else if (uniforms.viewmode == 2) { // Phase
    let intensity = fract(atan2(elongation.y, elongation.x) / (2.0 * 3.14159265358979323846) + 1.0);
    fragmentOutputs.color = textureSample(
      colormapTexture,
      colormapSampler,
      vec2<f32>(intensity, uniforms.phaseColormapY)
    );
  }
}
