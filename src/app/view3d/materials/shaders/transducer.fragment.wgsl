varying vUV : vec2<f32>;
varying vSelected : f32;

uniform globalPhase : f32;
uniform innerRadius : f32;
uniform transducerType : f32;

// based on https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/
@fragment
fn main(input : FragmentInputs) -> FragmentOutputs {
  let cxy : vec2<f32> = 2.0 * fragmentInputs.vUV - 1.0;
  let r : f32 = dot(cxy, cxy);
  let delta : f32 = fwidth(r);
  let circleAlpha : f32 = smoothstep(1.0 + delta, 1.0 - delta, r);
  let alpha : f32 = select(circleAlpha, 1.0, uniforms.transducerType > 0.5);
  fragmentOutputs.color = vec4<f32>(0.5*(1.0 + sin(uniforms.globalPhase)), fragmentInputs.vSelected, 0.5*(1.0 - sin(uniforms.globalPhase)), alpha);
}
