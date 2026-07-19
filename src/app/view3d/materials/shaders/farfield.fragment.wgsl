#include<ExcitationBuffer>

uniform numElements : i32;

var colormapSampler : sampler;
var colormapTexture : texture_2d<f32>;
uniform colormapY : f32;

uniform globalPhase : f32;

uniform k : f32;
uniform t : f32;

uniform dynamicRange : f32;

varying r : vec3<f32>;
varying uvf : vec2<f32>;
varying absresult : f32;
varying globalPos: vec3<f32>;

@fragment
fn main(input : FragmentInputs) -> FragmentOutputs {
  // var result = vec2<f32>(0,0);

  // for (var i = 0; i < uniforms.numElements; i++) {
  //     let element = excitation.elements[i];
  //     let argv = element.position.xy*fragmentInputs.uvf;
  //     let argument = uniforms.k*(argv.x+argv.y) + element.phasor.x;
  //     result += vec2(cos(argument), sin(argument));
  // }

  //let intensity = 0.5 + 0.5 * length(result) / (f32(uniforms.numElements));

  if length(fragmentInputs.uvf) > 1.0 {
    discard;
  }

  let lightPos : vec3<f32> = vec3<f32>(-5.0, 5.0, 5.0);
  let lightDir : vec3<f32> = normalize(lightPos - fragmentInputs.globalPos);

  let b = dpdx(fragmentInputs.globalPos);
  let a = dpdy(fragmentInputs.globalPos);
  let normal : vec3<f32> = normalize(cross(b, a));

  let diff = max(dot(normal, lightDir), 0.0);
  let ambient = 0.1;
  let intensity = ambient + (1.0 - ambient) * diff;
  fragmentOutputs.color = textureSample(
    colormapTexture,
    colormapSampler,
    vec2(fragmentInputs.absresult, uniforms.colormapY)
  ) * 0.5 * (1.0 + intensity);
  fragmentOutputs.color.a = 1.0;
  return fragmentOutputs;
}
