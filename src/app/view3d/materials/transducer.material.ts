import { type Scene } from '@babylonjs/core/scene';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';

import '@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration';
import '@babylonjs/core/Shaders/ShadersInclude/instancesVertex';
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage';

const transducerVertexShaderCode = /* wgsl */ `
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
`;

const transducerFragmentShaderCode = /* wgsl*/ `
  varying vUV : vec2<f32>;
  varying vSelected : f32;

  uniform globalPhase : f32;
  uniform transducerDiameter : f32;

  uniform innerRadius : f32;

  // based on https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/
  @fragment
  fn main(input : FragmentInputs) -> FragmentOutputs {
    
    let cxy : vec2<f32> = 2.0 * fragmentInputs.vUV - 1.0;
    let r : f32 = dot(cxy, cxy);
    let delta : f32 = fwidth(r);
    let alpha : f32 = smoothstep(uniforms.innerRadius - delta, uniforms.innerRadius + delta, r) - smoothstep(1.0 - delta, 1.0 + delta, r);
    fragmentOutputs.color = vec4<f32>(0.5*(1.0 + sin(uniforms.globalPhase)), fragmentInputs.vSelected, 0.5*(1.0 - sin(uniforms.globalPhase)), alpha);
  }
`;

export class TransducerMaterial extends ShaderMaterial {
  constructor(scene: Scene) {
    super(
      'TransducerMaterial',
      scene,
      {
        vertexSource: transducerVertexShaderCode,
        fragmentSource: transducerFragmentShaderCode,
      },
      {
        attributes: ['position', 'normal', 'uv', 'selected'],
        uniforms: ['parameter', 'transducerDiameter', 'innerRadius'],
        uniformBuffers: ['Scene', 'Mesh'],
        needAlphaBlending: true,
        shaderLanguage: ShaderLanguage.WGSL,
      },
    );
    this.backFaceCulling = false;
  }
}
