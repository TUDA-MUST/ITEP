struct Uniforms {
  k : f32,
  omega : f32,
  t : f32,
  numElements : i32,
  numPoints : i32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct ResultPoint {
  x : f32,
  u : f32,
}

struct ExcitationElement { // size per element: 8
  position : vec4<f32>, // offset 0
  phasor : vec4<f32>, // 0: phase shift [rad], 1: radiator area weight, 2-3: reserved // offset 16
};

struct ExcitationBuffer {
  elements: array<ExcitationElement, 2048>,
};

@group(0) @binding(1) var<uniform> excitation: ExcitationBuffer;
@group(0) @binding(2) var<storage,read_write> resultBuffer : array<f32>;

@compute @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  var resultu = vec2<f32>(0,0);
  var resultv = vec2<f32>(0,0);
  let t = f32(global_id.x) / f32(uniforms.numPoints);
  let u = mix(-1.0, 1.0, t);
  // Rework to process two elements at a time
  for (var i = 0; i < uniforms.numElements; i++) {
      let element = excitation.elements[i];
      let argvu = element.position.xy*vec2<f32>(u,0.0);
      //float argument = k*(argv.x+argv.y) + element.delay*omega;
      let argumentu = uniforms.k*(argvu.x+argvu.y) + element.phasor.x;
      resultu += vec2<f32>(cos(argumentu), sin(argumentu));

      let argvv = element.position.xy*vec2<f32>(0.0, u);
      //float argument = k*(argv.x+argv.y) + element.delay*omega;
      let argumentv = uniforms.k*(argvv.x+argvv.y) + element.phasor.x;
      resultv += vec2<f32>(cos(argumentv), sin(argumentv));
  }
  resultBuffer[global_id.x] = u;
  resultBuffer[global_id.x + u32(uniforms.numPoints)] = abs(f32(resultu.x));
  resultBuffer[global_id.x + u32(2*uniforms.numPoints)] = abs(f32(resultv.x));
}
