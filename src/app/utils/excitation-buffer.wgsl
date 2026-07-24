struct ExcitationElement { // size per element: 8
  position : vec4<f32>, // offset 0
  phasor : vec4<f32>, // 0: phase shift [rad], 1: radiator area weight, 2-3: reserved // offset 16
};

struct ExcitationBuffer {
  elements: array<ExcitationElement, 2048>,
};

var<uniform> excitation: ExcitationBuffer;
