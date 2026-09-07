struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) selected: f32,
};

@vertex
fn mainVertex(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let instanceWorld = mat4x4<f32>(input.world0, input.world1, input.world2, input.world3);
  out.position = shaderSystem.worldViewProjection * instanceWorld * vec4<f32>(input.position, 1.0);
  out.uv = input.uv;
  out.selected = input.color.x;
  return out;
}
