import { Scene } from '@babylonjs/core/scene';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';

import { excitationBufferMaxElementsDefine } from '../../utils/excitationbuffer';
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage';

const vertexSource = /* wgsl */`
  #include<ExcitationBuffer>
  uniform numElements : i32;
  uniform dynamicRange : f32;
  uniform k : f32;
  uniform ka : f32; // k * a

  // Uniforms
  uniform worldViewProjection : mat4x4<f32>;

  // Attributes
  attribute position : vec3<f32>;
  attribute uv : vec2<f32>;

  // Varying
  varying r : vec3<f32>;
  varying uvf : vec2<f32>;
  varying absresult : f32;
  varying globalPos: vec3<f32>;

// ---- Konstanten
const PI: f32                = 3.1415926535897932384626433832795;
const THREE_PI_OVER_4: f32   = 0.75 * PI;
const SQRT_2_OVER_PI: f32    = sqrt(2.0 / PI);
const U_SMALL: f32           = 1e-3;

// ---- J1-Approx für x >= 0
// Klein-x:  J1(x) ≈ (x/2) * (1 - r/2 + r^2/12 - r^3/144), r=(x/2)^2
// Groß-x:   J1(x) ≈ sqrt(2/(π x)) * cos(x - 3π/4)
fn j1_approx_pos(x: f32) -> f32 {
  if (x <= 3.0) {
    let xh = 0.5 * x;
    let r  = xh * xh;
    // Horner: (((-1/144)*r + 1/12)*r - 1/2)*r + 1
    let p  = fma(fma(fma(-1.0/144.0, r, 1.0/12.0), r, -0.5), r, 1.0);
    return xh * p;
  } else {
    // sqrt(2/(πx)) = sqrt(2/π) * inverseSqrt(x)
    return (SQRT_2_OVER_PI * inverseSqrt(x)) * cos(x - THREE_PI_OVER_4);
  }
}

// jinc(u) = 2*J1(|u|)/|u|  (even) mit Reihen-Fallback für sehr kleine u
fn jinc_even(u: f32) -> f32 {
  let au = abs(u);
  if (au < U_SMALL) {
    let u2 = au * au;
    // 1 - u^2/8 + u^4/192  -> fma(u2, fma(u2, 1/192, -1/8), 1)
    return fma(u2, fma(u2, 1.0/192.0, -0.125), 1.0);
  }
  return (2.0 * j1_approx_pos(au)) / au;
}

fn element_factor_uv(uv: vec2<f32>, ka: f32) -> f32 {
  let rho = min(length(uv), 0.9999999);   // = sin(theta)
  return jinc_even(ka * rho);
}

  @vertex
  fn main(input : VertexInputs) -> FragmentInputs {
    var result = vec2<f32>(0,0);

    // Rework to process two elements at a time
    for (var i = 0; i < uniforms.numElements; i++) {
        let element = excitation.elements[i];
        let argv = element.position.xy*vertexInputs.uv;
        //float argument = k*(argv.x+argv.y) + element.delay*omega;
        let argument = uniforms.k*(argv.x+argv.y) - element.phasor.x;
        result += vec2<f32>(cos(argument), sin(argument));
    }


    // Use vertex

    //float tf = abs(2*(texture(transducerFactor,.25*uv+vec2(.5,.5)).x)-.5);

    let tf : f32 = element_factor_uv(vertexInputs.uv, uniforms.ka);

    // const tf = 1.0;
    let af = length(result);

    let db_val = 10.0*log((af*tf)/f32(uniforms.numElements));
    let shifted_val = db_val+uniforms.dynamicRange;
    let absresult = saturate(shifted_val/uniforms.dynamicRange);

    // 1- x^2 - y^2
    let possquared = vertexInputs.position * vertexInputs.position;
    let direction = vec3<f32>(
      vertexInputs.position.xy,
      saturate(sqrt(1.0-possquared.x-possquared.y))
    );

    vertexOutputs.position = uniforms.worldViewProjection * vec4(direction * absresult * 0.02, 1.0);
    vertexOutputs.r = vertexInputs.position;
    vertexOutputs.uvf = vertexInputs.uv;
    vertexOutputs.absresult = absresult;
    vertexOutputs.globalPos = direction * absresult * 0.02;
  }
`;
const fragmentSource = /* wgsl */`
  #include<ExcitationBuffer>
 
  uniform numElements : i32;

  var viridisSampler : sampler;
  var viridisTexture : texture_2d<f32>;

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
    fragmentOutputs.color = textureSample(viridisTexture, viridisSampler, vec2(fragmentInputs.absresult, 0.375)) * 0.5 * (1.0 + intensity);
    fragmentOutputs.color.a = 1.0;
    return fragmentOutputs;
  }
`;

export class FarfieldMaterial extends ShaderMaterial {
  constructor(scene: Scene) {
    super('FarfieldMaterial', scene, {
      vertexSource,
      fragmentSource,
    }, {
      attributes: [
        "position",
        "normal",
        "uv",
      ],
      uniforms: [
        "worldViewProjection",
        "projection",
        "globalPhase",
        "k",
        "t",
        "dynamicRange",
        "numElements",
      ],
      uniformBuffers: [
        "Scene", "Mesh", 'excitation'
      ],
      samplers: ['viridisSampler'],
      defines: [
        "#define INSTANCES", 
        excitationBufferMaxElementsDefine
      ],
      shaderLanguage: ShaderLanguage.WGSL,
    });

    this.backFaceCulling = false;
    this.wireframe = false;
  }
}
