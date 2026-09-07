import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import type { OnDestroy } from '@angular/core';
import {
  addToScene,
  createLineMaterial,
  createLineSystem,
  createMeshFromData,
  setMeshVisible,
  setShaderUniform,
  setThinInstanceColors,
  setThinInstances,
  type Mesh,
  type ShaderMaterial,
} from '@babylonjs/lite';

import type { TransducerType } from 'src/app/core/transducer';
import type { SelectionState } from 'src/app/store/selection.state';
import type { Transducer } from 'src/app/store/store.service';
import { createTransducerLiteMaterial } from '../../materials/transducer.material';
import { LiteRendererResourcesDirective } from '../../smart-components/lite-renderer-resources/lite-renderer-resources.directive';
import { LiteViewDirective } from '../../smart-components/lite-view/lite-view.directive';

const squarePositions = new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0]);
const squareUvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
const quadIndices = new Uint32Array([0, 1, 2, 1, 3, 2]);

@Component({
  selector: 'app-excitation-renderer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcitationRendererComponent implements OnDestroy {
  private readonly view = inject(LiteViewDirective);
  private readonly resources = inject(LiteRendererResourcesDirective);

  readonly transducers = input<Transducer[] | null>(null);
  readonly transducerModel = input.required<TransducerType>();
  readonly selection = input<SelectionState | null>(null);
  readonly hovered = output<number>();

  private material: ShaderMaterial | null = null;
  private surfaceMesh: Mesh | null = null;
  private pointMesh: Mesh | null = null;
  private circularOutlineMesh: Mesh | null = null;
  private rectangularOutlineMesh: Mesh | null = null;
  private removePointerListeners: (() => void) | null = null;
  private pendingPointer: { x: number; y: number } | null = null;
  private picking = false;

  private readonly initialize = effect(() => {
    const context = this.resources.bufferContext();
    if (!context || this.surfaceMesh) return;
    this.initializeMeshes(context);
  });

  private readonly update = effect(() => {
    const transducers = this.transducers() ?? [];
    const model = this.transducerModel();
    const selection = this.selection();
    if (this.surfaceMesh) this.updateTransducers(transducers, model, selection);
  });

  private readonly initializePicking = effect(() => {
    const ready = this.resources.pickerReady();
    const mesh = this.resources.transducerMesh();
    if (ready && mesh && !this.removePointerListeners) this.enableHoverPicking();
  });

  private initializeMeshes(
    context: NonNullable<ReturnType<LiteRendererResourcesDirective['bufferContext']>>,
  ): void {
    this.material = createTransducerLiteMaterial();
    // Lite's stencil reference is fixed at zero. Result writers increment
    // covered pixels, so transducers render only where the stencil remains 0.
    this.material.stencil = { compare: 'equal' };

    this.surfaceMesh = createMeshFromData(
      context.engine,
      'excitation',
      squarePositions,
      new Float32Array(squarePositions.length),
      quadIndices,
      squareUvs,
    );
    this.surfaceMesh.material = this.material;
    this.surfaceMesh.renderOrder = 2;
    addToScene(context.scene, this.surfaceMesh);
    this.resources.transducerMesh.set(this.surfaceMesh);

    const circularMaterial = createLineMaterial({
      color: { r: 1, g: 1, b: 1, a: 0.99 },
      useThinInstances: true,
      useVertexAlpha: true,
      depthCompare: 'always',
      depthWrite: false,
    });
    circularMaterial.stencil = { compare: 'not-equal' };
    this.circularOutlineMesh = createLineSystem(context.engine, {
      name: 'hiddenLinesCircular',
      lines: [
        Array.from({ length: 65 }, (_, index) => {
          const angle = (index / 64) * Math.PI * 2;
          return { x: Math.cos(angle) * 0.5, y: Math.sin(angle) * 0.5, z: 0 };
        }),
      ],
      material: circularMaterial,
      useThinInstances: true,
      useVertexAlpha: true,
    });
    this.circularOutlineMesh.renderOrder = 2;
    this.circularOutlineMesh.pickable = false;
    addToScene(context.scene, this.circularOutlineMesh);

    const rectangularMaterial = createLineMaterial({
      color: { r: 1, g: 1, b: 1, a: 0.99 },
      useThinInstances: true,
      useVertexAlpha: true,
      depthCompare: 'always',
      depthWrite: false,
    });
    rectangularMaterial.stencil = { compare: 'not-equal' };
    this.rectangularOutlineMesh = createLineSystem(context.engine, {
      name: 'hiddenLinesRectangular',
      lines: [
        [
          { x: -0.5, y: -0.5, z: 0 },
          { x: 0.5, y: -0.5, z: 0 },
          { x: 0.5, y: 0.5, z: 0 },
          { x: -0.5, y: 0.5, z: 0 },
          { x: -0.5, y: -0.5, z: 0 },
        ],
      ],
      material: rectangularMaterial,
      useThinInstances: true,
      useVertexAlpha: true,
    });
    this.rectangularOutlineMesh.renderOrder = 2;
    this.rectangularOutlineMesh.pickable = false;
    addToScene(context.scene, this.rectangularOutlineMesh);

    this.pointMesh = createLineSystem(context.engine, {
      name: 'point',
      lines: [
        [
          { x: -0.5, y: -0.5, z: 0 },
          { x: 0.5, y: 0.5, z: 0 },
        ],
        [
          { x: -0.5, y: 0.5, z: 0 },
          { x: 0.5, y: -0.5, z: 0 },
        ],
      ],
      color: { r: 1, g: 1, b: 1, a: 0.99 },
      useThinInstances: true,
      useVertexAlpha: true,
    });
    this.pointMesh.renderOrder = 2;
    this.pointMesh.pickable = false;
    addToScene(context.scene, this.pointMesh);

    this.updateTransducers(this.transducers() ?? [], this.transducerModel(), this.selection());
  }

  private updateTransducers(
    transducers: Transducer[],
    model: TransducerType,
    selection: SelectionState | null,
  ): void {
    if (
      !this.surfaceMesh ||
      !this.material ||
      !this.pointMesh ||
      !this.circularOutlineMesh ||
      !this.rectangularOutlineMesh
    )
      return;

    const matrices = new Float32Array(transducers.length * 16);
    const pointMatrices = new Float32Array(transducers.length * 16);
    const colors = new Float32Array(transducers.length * 4);
    const width =
      model.type === 'Rectangular' ? model.width : model.type === 'Piston' ? model.diameter : 0;
    const height =
      model.type === 'Rectangular' ? model.height : model.type === 'Piston' ? model.diameter : 0;
    const bounds = transducers.reduce(
      (current, transducer) => ({
        left: Math.min(current.left, transducer.pos.x),
        right: Math.max(current.right, transducer.pos.x),
        bottom: Math.min(current.bottom, transducer.pos.y),
        top: Math.max(current.top, transducer.pos.y),
      }),
      { left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity },
    );
    const pointCrossSize = Math.max(
      Math.max(bounds.right - bounds.left, bounds.top - bounds.bottom) * 0.005,
      0.0001,
    );

    transducers.forEach((transducer, index) => {
      const offset = index * 16;
      matrices.set(
        [
          width,
          0,
          0,
          0,
          0,
          height,
          0,
          0,
          0,
          0,
          1,
          0,
          transducer.pos.x,
          transducer.pos.y,
          transducer.pos.z,
          1,
        ],
        offset,
      );
      pointMatrices.set(
        [
          pointCrossSize,
          0,
          0,
          0,
          0,
          pointCrossSize,
          0,
          0,
          0,
          0,
          1,
          0,
          transducer.pos.x,
          transducer.pos.y,
          transducer.pos.z,
          1,
        ],
        offset,
      );
      colors[index * 4] = selection?.hovered.includes(index) ? 1 : 0;
      colors[index * 4 + 3] = 1;
    });

    setThinInstances(this.surfaceMesh, matrices, transducers.length);
    setThinInstanceColors(this.surfaceMesh, colors);
    setShaderUniform(this.material, 'transducerType', model.type === 'Rectangular' ? 1 : 0);
    setThinInstances(this.pointMesh, pointMatrices, transducers.length);
    setThinInstances(this.circularOutlineMesh, matrices, transducers.length);
    setThinInstances(this.rectangularOutlineMesh, matrices, transducers.length);

    const hasTransducers = transducers.length > 0;
    setMeshVisible(this.pointMesh, hasTransducers && model.type === 'Point');
    setMeshVisible(this.surfaceMesh, hasTransducers && model.type !== 'Point');
    setMeshVisible(this.circularOutlineMesh, hasTransducers && model.type === 'Piston');
    setMeshVisible(this.rectangularOutlineMesh, hasTransducers && model.type === 'Rectangular');
  }

  private enableHoverPicking(): void {
    const canvas = this.view.canvas;
    const onPointerMove = (event: PointerEvent) => {
      if (this.resources.draggingRayleighProbe()) return;
      const bounds = canvas.getBoundingClientRect();
      this.pendingPointer = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      void this.processPendingPick();
    };
    const onPointerLeave = () => {
      this.pendingPointer = null;
      if (!this.resources.draggingRayleighProbe()) canvas.style.cursor = '';
      this.hovered.emit(-1);
    };
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    this.removePointerListeners = () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }

  private async processPendingPick(): Promise<void> {
    const transducerMesh = this.surfaceMesh;
    if (this.picking || !transducerMesh) return;
    this.picking = true;
    try {
      while (this.pendingPointer) {
        const pointer = this.pendingPointer;
        this.pendingPointer = null;
        const probe = this.resources.rayleighProbeMesh();
        const result = await this.resources.pick(
          pointer.x,
          pointer.y,
          (mesh) => mesh === transducerMesh || mesh === probe,
        );
        if (result?.pickedMesh === probe) {
          this.view.canvas.style.cursor = 'grab';
          this.hovered.emit(-1);
        } else {
          this.view.canvas.style.cursor = '';
          this.hovered.emit(result?.pickedMesh === transducerMesh ? result.thinInstanceIndex : -1);
        }
      }
    } finally {
      this.picking = false;
    }
  }

  ngOnDestroy(): void {
    this.removePointerListeners?.();
    if (this.resources.transducerMesh() === this.surfaceMesh) {
      this.resources.transducerMesh.set(null);
    }
  }
}
