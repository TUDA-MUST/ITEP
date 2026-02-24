import { ChangeDetectionStrategy, Component, effect, forwardRef, input, output } from '@angular/core';

import { TransducerMaterial } from '../../materials/transducer.material';
import { type Mesh } from '@babylonjs/core/Meshes/mesh';
import { Plane } from '@babylonjs/core/Maths/math.plane';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MAT4_ELEMENT_COUNT, SCALAR_ELEMENT_COUNT } from '../../../utils/webgl.utils';

import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions';
import { ActionManager } from '@babylonjs/core/Actions/actionManager';

import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Meshes/thinInstanceMesh';

import { type SelectionState } from 'src/app/store/selection.state';
import { type Scene } from '@babylonjs/core/scene';
import { BabylonConsumer } from '../../interfaces/lifecycle';
import { Engine } from '@babylonjs/core/Engines/engine';
import { type Transducer } from 'src/app/store/store.service';
import { type LinesMesh } from '@babylonjs/core/Meshes/linesMesh';
import { CreateLineSystem } from '@babylonjs/core/Meshes/Builders/linesBuilder';

@Component({
  selector: 'app-excitation-renderer',
  template: '<ng-content/>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [{ provide: BabylonConsumer, useExisting: forwardRef(() => ExcitationRendererComponent) }],
})
export class ExcitationRendererComponent extends BabylonConsumer {
  readonly transducers = input<Transducer[] | null>(null);
  readonly transducerDiameter = input<number | null>(null);
  readonly transducerModel = input<'Point' | 'Piston'>('Piston');
  readonly selection = input<SelectionState | null>(null);
  readonly hovered = output<number>();

  private pointMesh: LinesMesh;

  private pistonTransducerMaterial: TransducerMaterial;
  private pistonTransducerMesh: Mesh;
  private pistonTransducerLineMeshHidden: LinesMesh;

  async ngxSceneCreated(scene: Scene): Promise<void> {
    this.initialize3D(scene);
    this.uploadArrayConfig(this.transducers(), this.selection());
  }

  updateArrayConfig = effect(() => {
    const transducers = this.transducers();
    const selection = this.selection();

    if (this.pistonTransducerMaterial) {
      this.uploadArrayConfig(transducers, selection);
    }
  })

  public initialize3D(scene: Scene): void {
    const origin = new Vector3(0, 0, 0);
    const zPositive = new Vector3(0, 0, -1);
    const aperturePlane = Plane.FromPositionAndNormal(origin, zPositive);

    const apertureOptions = {
      sourcePlane: aperturePlane,
      size: 1,
    };
    
    this.pistonTransducerMaterial = new TransducerMaterial(scene);
    this.pistonTransducerMaterial.depthFunction = Engine.ALWAYS;
    this.pistonTransducerMaterial.stencil.enabled = true;
    this.pistonTransducerMaterial.stencil.funcRef = 1;
    this.pistonTransducerMaterial.stencil.func = Engine.NOTEQUAL;
    this.pistonTransducerMaterial.stencil.opStencilDepthPass = Engine.KEEP;
    this.pistonTransducerMaterial.setFloat('innerRadius', 0.0);

    this.pistonTransducerMesh = CreatePlane('excitationHidden', apertureOptions, scene);
    this.pistonTransducerMesh.material = this.pistonTransducerMaterial;
    this.pistonTransducerMesh.renderingGroupId = 1;
    this.pistonTransducerMesh.thinInstanceEnablePicking = true;
    this.pistonTransducerMesh.pointerOverDisableMeshTesting = false;

    const segments = 64;
    const points = Array.from({ length: segments + 1 }, (_, i) => {
      const a = (i / segments) * Math.PI * 2;
      return new Vector3(Math.cos(a) * .5, Math.sin(a) *.5, 0);
    });

    this.pistonTransducerLineMeshHidden = CreateLineSystem('hiddenLines', {
      lines: [points]
    }, scene);
    this.pistonTransducerLineMeshHidden.renderingGroupId = 1;

    const hiddenLinesMaterial = this.pistonTransducerLineMeshHidden.material!;
    hiddenLinesMaterial.alpha = 0.99;
    hiddenLinesMaterial.depthFunction = Engine.ALWAYS;
    hiddenLinesMaterial.stencil.enabled = true;
    hiddenLinesMaterial.stencil.funcRef = 1;
    hiddenLinesMaterial.stencil.func = Engine.EQUAL;
    hiddenLinesMaterial.stencil.opStencilDepthPass = Engine.KEEP;

    const actionManager = new ActionManager(scene);
    this.pistonTransducerMesh.actionManager = actionManager;

    actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnPointerOverTrigger,
        },
        (event) => {
          const pickingResult = scene.pick(event.pointerX, scene.pointerY);
          this.hovered.emit(pickingResult.thinInstanceIndex);
        }
      )
    )
    actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnPointerOutTrigger,
        },
        (_event) => this.hovered.emit(-1)
      )
    )

    const options = {
      lines: [[
        new Vector3(-.5, -.5, 0),
        new Vector3(.5, .5, 0)
      ], [
        new Vector3(-.5, .5, 0),
        new Vector3(.5, -.5, 0)
      ]],
    }

    this.pointMesh = CreateLineSystem("point", options, scene);
    this.pointMesh.renderingGroupId = 1;
    this.pointMesh.material!.alpha = 0.99;

    this.uploadArrayConfig(this.transducers(), this.selection());
  }

  private uploadArrayConfig(transducersx: Transducer[] | null, selectionx: SelectionState | null): void {
    const transducers = transducersx ?? []
    const selection: SelectionState = selectionx ?? { hovered: [], selected: [] };

    const initial = { left: Infinity, top: -Infinity, right: -Infinity, bottom: Infinity };

    const rawBB = (transducers ?? []).reduce((acc, t) => ({
      left: Math.min(acc.left, t.pos.x),
      top: Math.max(acc.top, t.pos.y),
      right: Math.max(acc.right, t.pos.x),
      bottom: Math.min(acc.bottom, t.pos.y)
    }), initial);

    const maxDim = Math.max(rawBB.right - rawBB.left, rawBB.top - rawBB.bottom);
    const pointCrossSize = Math.max(maxDim * 0.005, 0.0001);

    const buffers = (transducers ?? []).reduce(
      (buffers, transducer, index) => {
        Matrix.Scaling(this.transducerDiameter()!, this.transducerDiameter()!, 1).multiply(Matrix.Translation(
          transducer.pos.x,
          transducer.pos.y,
          transducer.pos.z
        )).copyToArray(buffers.matrices, index * MAT4_ELEMENT_COUNT);

        Matrix.Scaling(pointCrossSize, pointCrossSize, 1).multiply(Matrix.Translation(
          transducer.pos.x,
          transducer.pos.y,
          transducer.pos.z
        )).copyToArray(buffers.pointMatrices, index * MAT4_ELEMENT_COUNT);

        buffers.selection[index] = selection.hovered.includes(index) ? 1 : 0;

        return buffers;
      },
      {
        matrices: new Float32Array(MAT4_ELEMENT_COUNT * transducers.length),
        pointMatrices: new Float32Array(MAT4_ELEMENT_COUNT * transducers.length),
        selection: new Float32Array(SCALAR_ELEMENT_COUNT * transducers.length)
      }
    );
      
    const allMeshes = [this.pointMesh, this.pistonTransducerMesh, this.pistonTransducerLineMeshHidden];
    if (transducers.length > 0) {
      const pistonMeshes = [this.pistonTransducerMesh, this.pistonTransducerLineMeshHidden];
      switch (this.transducerModel()) {
        case 'Point':
          this.pointMesh.thinInstanceSetBuffer(
            'matrix',
            buffers.pointMatrices,
            MAT4_ELEMENT_COUNT,
            false
          );
          this.pointMesh.setEnabled(true);
          pistonMeshes.forEach(mesh => {
            mesh.setEnabled(false);
          });
          break;
        case 'Piston':
          this.pointMesh.setEnabled(false);
          pistonMeshes.forEach(mesh => {
            mesh.setEnabled(true);
            mesh.thinInstanceSetBuffer(
              'matrix',
              buffers.matrices,
              MAT4_ELEMENT_COUNT,
              false
            );

            mesh.thinInstanceSetBuffer(
              'selected',
              buffers.selection,
              SCALAR_ELEMENT_COUNT,
              false
            );
          });
          break;
      }
    } else {
      allMeshes.forEach(mesh => {
        mesh.setEnabled(false);
      });
    }
  }
}
