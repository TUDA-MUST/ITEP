struct ExcitationElement { position: vec4<f32>, phasor: vec4<f32>, };

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) intensity: f32,
  @location(2) worldPosition: vec3<f32>,
};

@fragment
fn mainFragment(input: VertexOutput) -> @location(0) vec4<f32> {
  if (length(input.uv) > 1.0) { discard; }
  // The Lite camera mirrors the legacy right-handed view across X. Mirror the
  // legacy shader's fixed light source too, preserving its screen-side position.
  let lightDirection = normalize(vec3<f32>(5.0, 5.0, 5.0) - input.worldPosition);
  let normal = normalize(cross(dpdx(input.worldPosition), dpdy(input.worldPosition)));
  let lighting = 0.1 + 0.9 * max(dot(normal, lightDirection), 0.0);
  var color = textureSample(colormap, colormapSampler, vec2<f32>(input.intensity, shaderUniforms.colormapY));
  color = vec4<f32>(color.rgb * (0.5 * (1.0 + lighting)), color.a);
  color.a = 1.0;
  return color;
}
