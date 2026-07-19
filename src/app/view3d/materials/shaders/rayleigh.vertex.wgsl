#include<sceneUboDeclaration>
#include<meshUboDeclaration>

uniform worldViewProjection : mat4x4<f32>;

attribute position : vec3<f32>;

varying r : vec3<f32>;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
  vertexOutputs.position = uniforms.worldViewProjection * vec4(vertexInputs.position, 1.0);
  vertexOutputs.r = vertexInputs.position;
}
