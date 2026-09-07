struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) selected: f32,
};

@fragment
fn mainFragment(input: VertexOutput) -> @location(0) vec4<f32> {
  let centeredUv = 2.0 * input.uv - 1.0;
  let radiusSquared = dot(centeredUv, centeredUv);
  let delta = fwidth(radiusSquared);
  let circleAlpha = smoothstep(1.0 + delta, 1.0 - delta, radiusSquared);
  let alpha = select(circleAlpha, 1.0, shaderUniforms.transducerType > 0.5);
  return vec4<f32>(
    0.5 * (1.0 + sin(shaderUniforms.globalPhase)),
    input.selected,
    0.5 * (1.0 - sin(shaderUniforms.globalPhase)),
    alpha,
  );
}
