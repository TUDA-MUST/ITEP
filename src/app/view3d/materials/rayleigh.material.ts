import { type Scene } from '@babylonjs/core/scene';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Engine } from '@babylonjs/core/Engines/engine';
import { excitationBufferMaxElementsDefine } from '../../utils/excitationbuffer';
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage';

import { TextureSampler } from '@babylonjs/core/Materials/Textures/textureSampler';
import { Constants } from '@babylonjs/core/Engines/constants';
import { type BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';
import { colormapTextureSampleRows } from '../shared/colormap-texture';

const rayleighVertexShaderCode = /* wgsl*/ `
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
`;
const rayleighFragmentShaderCode = /* wgsl*/ `
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
      // elm.phasor.x is a phase shift
      let delay = elm.phasor.x / uniforms.omega;

      let argz = (d*uniforms.k + delay*uniforms.omega - uniforms.globalPhase);
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
`;

// Do not make type since integers are needed for shader uniforms
export enum ResultAspect {
  Elongation = 0,
  Amplitude = 1,
  Phase = 2,
}

export class RayleighMaterial extends ShaderMaterial {
  constructor(scene: Scene, texture: BaseTexture) {
    super(
      'RayleighMaterial',
      scene,
      {
        vertexSource: rayleighVertexShaderCode,
        fragmentSource: rayleighFragmentShaderCode,
      },
      {
        attributes: ['position', 'normal', 'uv'],
        uniforms: [
          'worldViewProjection',
          'globalPhase',
          'k',
          'omega',
          'viewmode',
          'dynamicRange',
          'elongationColormapY',
          'magnitudeColormapY',
          'phaseColormapY',
          'numElements',
        ],
        uniformBuffers: ['Scene', 'Mesh', 'excitation'],
        samplers: ['colormapSampler'],
        defines: ['#define INSTANCES', excitationBufferMaxElementsDefine],
        shaderLanguage: ShaderLanguage.WGSL,
      },
    );
    this.backFaceCulling = false;

    this.setTexture('colormapTexture', texture);
    this.setFloat('elongationColormapY', colormapTextureSampleRows.coolwarm);
    this.setFloat('magnitudeColormapY', colormapTextureSampleRows.viridis);
    this.setFloat('phaseColormapY', colormapTextureSampleRows.twilightShifted);
    const sampler = new TextureSampler();

    sampler.setParameters(Engine.TEXTURE_CLAMP_ADDRESSMODE, Engine.TEXTURE_CLAMP_ADDRESSMODE); // use the default values
    sampler.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;

    this.setTextureSampler('colormapSampler', sampler);
  }

  public setResultAspect(aspect: ResultAspect | null): void {
    if (aspect !== null) {
      this.setInt('viewmode', aspect);
    }
  }
}
