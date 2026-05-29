import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  input,
  output,
} from '@angular/core';

import { TransducerMaterial } from '../../materials/transducer.material';
import { Mesh } from '@babylonjs/core/Meshes/mesh';

import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Meshes/thinInstanceMesh';

import type { SelectionState } from 'src/app/store/selection.state';
import type { Scene } from '@babylonjs/core/scene';
import { BabylonConsumer } from '../../interfaces/lifecycle';
import { Engine } from '@babylonjs/core/Engines/engine';
import type { Transducer } from 'src/app/store/store.service';
import type { LinesMesh } from '@babylonjs/core/Meshes/linesMesh';
import { CreateLineSystem } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions';
import { MAT4_ELEMENT_COUNT, SCALAR_ELEMENT_COUNT } from 'src/app/utils/webgl.utils';
import type { TransducerType } from 'src/app/core/transducer';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';

export const uniformSquareXY = (): VertexData => {
  const positions = [-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0];
  const uv = [0, 0, 1, 0, 0, 1, 1, 1];
  // FIXME: These should be the other way around.
  const indices = [0, 1, 2, 1, 3, 2];

  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.uvs = uv;
  return vertexData;
};

@Component({
  selector: 'app-excitation-renderer',
  template: '<ng-content/>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    { provide: BabylonConsumer, useExisting: forwardRef(() => ExcitationRendererComponent) },
  ],
})
export class ExcitationRendererComponent extends BabylonConsumer {
  readonly transducers = input<Transducer[] | null>(null);
  readonly transducerModel = input.required<TransducerType>();
  readonly selection = input<SelectionState | null>(null);
  readonly hovered = output<number>();

  private pointMesh: LinesMesh;

  private transducerMaterial: TransducerMaterial;

  private transducerSurfaceMesh: Mesh;
  private circularTransducerOutlineMesh: LinesMesh;
  private rectangularTransducerOutlineMesh: LinesMesh;

  async ngxSceneCreated(scene: Scene): Promise<void> {
    this.initialize3D(scene);
    this.uploadArrayConfig(this.transducers(), this.selection());
  }

  updateArrayConfig = effect(() => {
    const transducers = this.transducers();
    const selection = this.selection();

    if (this.transducerMaterial) {
      this.uploadArrayConfig(transducers, selection);
    }
  });

  public initialize3D(scene: Scene): void {
    this.transducerMaterial = new TransducerMaterial(scene);
    this.transducerMaterial.depthFunction = Engine.ALWAYS;
    this.transducerMaterial.stencil.enabled = true;
    this.transducerMaterial.stencil.funcRef = 1;
    this.transducerMaterial.stencil.func = Engine.NOTEQUAL;
    this.transducerMaterial.stencil.opStencilDepthPass = Engine.KEEP;
    this.transducerMaterial.setFloat('innerRadius', 0.0);

    this.transducerSurfaceMesh = new Mesh('excitation', scene);
    uniformSquareXY().applyToMesh(this.transducerSurfaceMesh);

    this.transducerSurfaceMesh.material = this.transducerMaterial;
    this.transducerSurfaceMesh.renderingGroupId = 1;
    this.transducerSurfaceMesh.thinInstanceEnablePicking = true;
    this.transducerSurfaceMesh.pointerOverDisableMeshTesting = false;

    const segments = 64;
    const points = Array.from({ length: segments + 1 }, (_, i) => {
      const a = (i / segments) * Math.PI * 2;
      return new Vector3(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0);
    });

    this.circularTransducerOutlineMesh = CreateLineSystem(
      'hiddenLinesCircular',
      {
        lines: [points],
      },
      scene,
    );
    this.circularTransducerOutlineMesh.renderingGroupId = 1;

    const hiddenLinesMaterial = this.circularTransducerOutlineMesh.material!;
    hiddenLinesMaterial.alpha = 0.99;
    hiddenLinesMaterial.depthFunction = Engine.ALWAYS;
    hiddenLinesMaterial.stencil.enabled = true;
    hiddenLinesMaterial.stencil.funcRef = 1;
    hiddenLinesMaterial.stencil.func = Engine.EQUAL;
    hiddenLinesMaterial.stencil.opStencilDepthPass = Engine.KEEP;

    const rectanglePoints = [
      new Vector3(-0.5, -0.5, 0),
      new Vector3(0.5, -0.5, 0),
      new Vector3(0.5, 0.5, 0),
      new Vector3(-0.5, 0.5, 0),
      new Vector3(-0.5, -0.5, 0),
    ];

    this.rectangularTransducerOutlineMesh = CreateLineSystem(
      'hiddenLinesRectangular',
      {
        lines: [rectanglePoints],
      },
      scene,
    );
    this.rectangularTransducerOutlineMesh.renderingGroupId = 1;

    const hiddenRectLinesMaterial = this.rectangularTransducerOutlineMesh.material!;
    hiddenRectLinesMaterial.alpha = 0.99;
    hiddenRectLinesMaterial.depthFunction = Engine.ALWAYS;
    hiddenRectLinesMaterial.stencil.enabled = true;
    hiddenRectLinesMaterial.stencil.funcRef = 1;
    hiddenRectLinesMaterial.stencil.func = Engine.EQUAL;
    hiddenRectLinesMaterial.stencil.opStencilDepthPass = Engine.KEEP;

    const actionManager = new ActionManager(scene);
    this.transducerSurfaceMesh.actionManager = actionManager;

    actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnPointerOverTrigger,
        },
        (event) => {
          const pickingResult = scene.pick(event.pointerX, scene.pointerY);
          this.hovered.emit(pickingResult.thinInstanceIndex);
        },
      ),
    );
    actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnPointerOutTrigger,
        },
        (_event) => this.hovered.emit(-1),
      ),
    );

    const options = {
      lines: [
        [new Vector3(-0.5, -0.5, 0), new Vector3(0.5, 0.5, 0)],
        [new Vector3(-0.5, 0.5, 0), new Vector3(0.5, -0.5, 0)],
      ],
    };

    this.pointMesh = CreateLineSystem('point', options, scene);
    this.pointMesh.renderingGroupId = 1;
    this.pointMesh.material!.alpha = 0.99;

    this.uploadArrayConfig(this.transducers(), this.selection());
  }

  private uploadArrayConfig(
    transducersx: Transducer[] | null,
    selectionx: SelectionState | null,
  ): void {
    const transducers = transducersx ?? [];
    const selection: SelectionState = selectionx ?? { hovered: [], selected: [] };

    const initial = { left: Infinity, top: -Infinity, right: -Infinity, bottom: Infinity };

    const rawBB = (transducers ?? []).reduce(
      (acc, t) => ({
        left: Math.min(acc.left, t.pos.x),
        top: Math.max(acc.top, t.pos.y),
        right: Math.max(acc.right, t.pos.x),
        bottom: Math.min(acc.bottom, t.pos.y),
      }),
      initial,
    );

    const maxDim = Math.max(rawBB.right - rawBB.left, rawBB.top - rawBB.bottom);
    const pointCrossSize = Math.max(maxDim * 0.005, 0.0001);

    const buffers = (transducers ?? []).reduce(
      (buffers, transducer, index) => {
        const model = this.transducerModel();
        const { width, height } =
          model.type === 'Piston'
            ? { width: model.diameter, height: model.diameter }
            : model.type === 'Rectangular'
              ? { width: model.width, height: model.height }
              : { width: 0, height: 0 };

        Matrix.Scaling(width, height, 1)
          .multiply(Matrix.Translation(transducer.pos.x, transducer.pos.y, transducer.pos.z))
          .copyToArray(buffers.matrices, index * MAT4_ELEMENT_COUNT);

        Matrix.Scaling(pointCrossSize, pointCrossSize, 1)
          .multiply(Matrix.Translation(transducer.pos.x, transducer.pos.y, transducer.pos.z))
          .copyToArray(buffers.pointMatrices, index * MAT4_ELEMENT_COUNT);

        buffers.selection[index] = selection.hovered.includes(index) ? 1 : 0;

        return buffers;
      },
      {
        matrices: new Float32Array(MAT4_ELEMENT_COUNT * transducers.length),
        pointMatrices: new Float32Array(MAT4_ELEMENT_COUNT * transducers.length),
        selection: new Float32Array(SCALAR_ELEMENT_COUNT * transducers.length),
      },
    );

    const allMeshes = [
      this.pointMesh,
      this.transducerSurfaceMesh,
      this.circularTransducerOutlineMesh,
      this.rectangularTransducerOutlineMesh,
    ];
    if (transducers.length > 0) {
      const nonPointMeshes = [
        this.transducerSurfaceMesh,
        this.circularTransducerOutlineMesh,
        this.rectangularTransducerOutlineMesh,
      ];
      switch (this.transducerModel().type) {
        case 'Point':
          this.pointMesh.thinInstanceSetBuffer(
            'matrix',
            buffers.pointMatrices,
            MAT4_ELEMENT_COUNT,
            false,
          );
          this.pointMesh.setEnabled(true);
          nonPointMeshes.forEach((mesh) => {
            mesh.setEnabled(false);
          });
          break;
        case 'Piston':
        case 'Rectangular':
          this.transducerMaterial.setTransducerModel(this.transducerModel());
          this.pointMesh.setEnabled(false);
          this.transducerSurfaceMesh.setEnabled(true);
          this.transducerSurfaceMesh.thinInstanceSetBuffer(
            'matrix',
            buffers.matrices,
            MAT4_ELEMENT_COUNT,
            false,
          );
          this.transducerSurfaceMesh.thinInstanceSetBuffer(
            'selected',
            buffers.selection,
            SCALAR_ELEMENT_COUNT,
            false,
          );

          const lineMesh =
            this.transducerModel().type === 'Piston'
              ? this.circularTransducerOutlineMesh
              : this.rectangularTransducerOutlineMesh;
          this.circularTransducerOutlineMesh.setEnabled(this.transducerModel().type === 'Piston');
          this.rectangularTransducerOutlineMesh.setEnabled(
            this.transducerModel().type === 'Rectangular',
          );

          lineMesh.thinInstanceSetBuffer('matrix', buffers.matrices, MAT4_ELEMENT_COUNT, false);
          lineMesh.thinInstanceSetBuffer(
            'selected',
            buffers.selection,
            SCALAR_ELEMENT_COUNT,
            false,
          );
          break;
      }
    } else {
      allMeshes.forEach((mesh) => {
        mesh.setEnabled(false);
      });
    }
  }
}
