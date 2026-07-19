#include<sceneUboDeclaration>
#include<meshUboDeclaration>
#include<instancesDeclaration>

attribute position : vec3<f32>;
attribute uv : vec2<f32>;
attribute selected : f32;

varying vUV : vec2<f32>;
varying vSelected : f32;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
#include<instancesVertex>
  vertexOutputs.position = scene.viewProjection * finalWorld * vec4<f32>(vertexInputs.position, 1.0);
  vertexOutputs.vUV = vertexInputs.uv;
  vertexOutputs.vSelected = vertexInputs.selected;
}
