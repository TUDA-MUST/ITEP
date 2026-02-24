import {
  ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { Textures, TransducerBufferConsumer } from '../../shared/transducer-buffer.component';
import { Point, ResultValues } from 'src/app/store/export.state';
import { BeamformingState } from 'src/app/store/beamforming.state';
import { Transducer } from 'src/app/store/store.service';

import { ComputeShader } from '@babylonjs/core/Compute/computeShader';
import { UniformBuffer } from '@babylonjs/core/Materials/uniformBuffer';
import { StorageBuffer } from '@babylonjs/core/Buffers/storageBuffer';
import { Scene } from '@babylonjs/core/scene';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';

const exportComputeShader = /* wgsl */`

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
  phasor : vec4<f32>, // 0: amplitude, 1: area, 2: delay, 3: dummy // Offset  16
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
}`

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-export-renderer',
    imports: [],
    template: '<ng-content />',
    providers: [{ provide: TransducerBufferConsumer, useExisting: ExportRendererComponent }]
})
export class ExportRendererComponent extends TransducerBufferConsumer {
  readonly results = output<ResultValues>();
  
  readonly transducers = input<Transducer[] | null>(null);
  readonly environment = input<number | null>(null);
  readonly beamforming = input<BeamformingState | null>(null);

  calcDataCall = effect(() => {
    this.calcData();
  });

  cs : ComputeShader | null = null;
  uniformBuffer: UniformBuffer;

  resultLabelBuffer : StorageBuffer | null = null;
  resultBuffer : StorageBuffer | null = null;
 
  numPoints = 200;

  ngxSceneAndBufferCreated(scene: Scene, buffer: UniformBuffer, _textures: Textures): void {
    this.cs = new ComputeShader("myCompute", scene.getEngine(), 
      { 
        computeSource: exportComputeShader 
      }, 
      { 
        bindingsMapping: {
          "uniforms": { group: 0, binding: 0 },
          "excitation": { group: 0, binding: 1 },
          "resultBuffer": { group: 0, binding: 2 },
        }
      }
    );

    this.uniformBuffer = new UniformBuffer(scene.getEngine());
    this.uniformBuffer.addUniform("k", 1);
    this.uniformBuffer.addUniform("omega", 1);
    this.uniformBuffer.addUniform("t", 1);
    this.uniformBuffer.addUniform("numElements", 1);
    this.uniformBuffer.addUniform("numPoints", 1);
    this.uniformBuffer.create();

    this.cs.setUniformBuffer("uniforms", this.uniformBuffer);
    this.cs.setUniformBuffer("excitation", buffer);

    this.resultBuffer = new StorageBuffer(scene.getEngine() as WebGPUEngine, this.numPoints * 3 * Float32Array.BYTES_PER_ELEMENT);
    this.cs.setStorageBuffer("resultBuffer", this.resultBuffer);
    this.calcData();
  }

  calcData() : void {
    if (this.cs && this.resultBuffer) {
      this.uniformBuffer.updateFloat("k", this.environment()!);
      const numElements = this.transducers()!.length;
      this.uniformBuffer.updateInt("numElements", numElements);
      this.uniformBuffer.updateInt("numPoints", this.numPoints);
      this.uniformBuffer.update();
      this.cs.dispatchWhenReady(this.numPoints, 1, 1).then(() => {
        this.resultBuffer!.read().then((res) => {
          const uOffset = this.numPoints * Float32Array.BYTES_PER_ELEMENT;
          const vOffset = this.numPoints * 2 * Float32Array.BYTES_PER_ELEMENT;
          const series = {
            labels: Array.from(new Float32Array(res.buffer, 0, this.numPoints)),
            u: Array.from(new Float32Array(res.buffer, uOffset, this.numPoints)),
            v: Array.from(new Float32Array(res.buffer, vOffset, this.numPoints))
          };
          const result = series.labels.reduce((acc, label, index) => {
            acc.u.push({x: label, y: series.u[index] / numElements});
            acc.v.push({x: label, y: series.v[index] / numElements});
            return acc;
          }, {u: new Array<Point>, v: new Array<Point>});
          this.results.emit(result);
        });
      });
    } 
  }
}
