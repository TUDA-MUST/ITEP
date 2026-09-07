struct VertexOutput {
  @builtin(position) position: vec4<f32>,
};

@vertex
fn mainVertex(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.position = shaderSystem.worldViewProjection * vec4<f32>(input.position, 1.0);
  return out;
}
