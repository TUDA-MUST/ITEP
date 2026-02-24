import {
  ChangeDetectionStrategy, Component, OnChanges, OnDestroy, forwardRef, input, output } from '@angular/core';

import { PositionGizmo } from '@babylonjs/core/Gizmos/positionGizmo';
import { CreateIcoSphere } from '@babylonjs/core/Meshes/Builders/icoSphereBuilder';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { BabylonConsumer } from '../../interfaces/lifecycle';
import { ArrayConfig } from 'src/app/store/store.service';
import { Scene } from '@babylonjs/core/scene';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-ura-interaction',
    imports: [],
    template: '<ng-content />',
    providers: [{ provide: BabylonConsumer, useExisting: forwardRef(() => UraInteractionRendererComponent) }]
})
export class UraInteractionRendererComponent extends BabylonConsumer implements OnDestroy, OnChanges {
  readonly arrayConfig = input<ArrayConfig | null>();
  readonly arrayConfigChange = output<ArrayConfig>();
  
  private pitchHandle: Mesh;
  private pitchGizmo: PositionGizmo;

  private numHandle: Mesh;
  private numGizmo: PositionGizmo;


  private pointerDragBehavior: PointerDragBehavior;
  private offset: Vector3;

  async ngxSceneCreated(_scene: Scene): Promise<void> {
    
    this.pitchHandle = CreateIcoSphere('arrayPitchHandle', {
      radius: 0.00025,
      subdivisions: 3,
    })

    this.pitchGizmo = new PositionGizmo();
    this.pitchGizmo.zGizmo.dispose();
    this.pitchGizmo.attachedMesh = this.pitchHandle;
    
    this.pitchGizmo.xGizmo.dragBehavior.moveAttached = false;
    this.pitchGizmo.xGizmo.dragBehavior.onDragStartObservable.add(event => 
      this.offset = this.pitchHandle.position.subtract(event.dragPlanePoint)
    );
    
    this.pitchGizmo.xGizmo.dragBehavior.onDragObservable.add(event => {
      const arrayConfig = this.arrayConfig();
      if (arrayConfig && arrayConfig.config.type === 'ura') {
        this.arrayConfigChange.emit({
          ...arrayConfig,
          config: {
            ...arrayConfig.config,
            pitchX: event.dragPlanePoint.add(this.offset).x * 2 / (arrayConfig.config.elementsX-1)
          }
        });
      }
    });

    this.pitchGizmo.yGizmo.dragBehavior.moveAttached = false;
    this.pitchGizmo.yGizmo.dragBehavior.onDragStartObservable.add(event => 
      this.offset = this.pitchHandle.position.subtract(event.dragPlanePoint)
    );
    this.pitchGizmo.yGizmo.dragBehavior.onDragObservable.add(event => {
      const arrayConfig = this.arrayConfig();
      if (arrayConfig && arrayConfig.config.type === 'ura') {
        this.arrayConfigChange.emit({
          ...arrayConfig,
          config: {
            ...arrayConfig.config,
            pitchY: event.dragPlanePoint.add(this.offset).y * 2 / (arrayConfig.config.elementsY-1)
          }
        });
      }
    });

    /// 

    this.numHandle = CreateIcoSphere('arrayPitchHandle', {
      radius: 0.00025,
      subdivisions: 3,
    })

    this.numGizmo = new PositionGizmo();
    this.numGizmo.zGizmo.dispose();
    this.numGizmo.attachedMesh = this.numHandle;
    this.numGizmo.xGizmo.dragBehavior.moveAttached = false;
    this.numGizmo.xGizmo.dragBehavior.onDragStartObservable.add(event => 
      this.offset = this.pitchHandle.position.subtract(event.dragPlanePoint)
    );
    this.numGizmo.xGizmo.dragBehavior.onDragObservable.add(event => {
      const arrayConfig = this.arrayConfig();
      if (arrayConfig && arrayConfig.config.type === 'ura') {
        this.arrayConfigChange.emit({
          ...arrayConfig,
          config: {
            ...arrayConfig.config,
            elementsX: Math.abs(1 + Math.round(2*event.dragPlanePoint.add(this.offset).x / arrayConfig.config.pitchX))
          }
        });
      }
    });

    this.numGizmo.yGizmo.dragBehavior.moveAttached = false;
    this.numGizmo.yGizmo.dragBehavior.onDragStartObservable.add(event => 
      this.offset = this.pitchHandle.position.subtract(event.dragPlanePoint)
    );
    this.numGizmo.yGizmo.dragBehavior.onDragObservable.add(event => {
      const arrayConfig = this.arrayConfig();
      if (arrayConfig && arrayConfig.config.type === 'ura') {
        this.arrayConfigChange.emit({
          ...arrayConfig,
          config: {
            ...arrayConfig.config,
            type: 'ura',
            elementsY: Math.abs(1 + Math.round(2*event.dragPlanePoint.add(this.offset).y / arrayConfig.config.pitchY)),  
          }
        });
      }
    });
    this.prepareHandles();
  }

  ngOnDestroy(): void {
    this.pitchHandle?.dispose();
    this.pitchGizmo?.dispose();

    this.numHandle?.dispose();
    this.numGizmo?.dispose();
  }

  ngOnChanges(): void {
    this.prepareHandles();
  }

  prepareHandles() : void {
    const arrayConfig = this.arrayConfig();
    if (arrayConfig && this.pitchHandle && arrayConfig.config.type === 'ura') {
      this.numHandle.position = new Vector3(
        arrayConfig.config.pitchX * arrayConfig.config.elementsX / 2, 
        arrayConfig.config.pitchY * arrayConfig.config.elementsY / 2,0);
    
        this.pitchHandle.position = new Vector3(
          arrayConfig.config.pitchX * (arrayConfig.config.elementsX-1) / 2, 
          arrayConfig.config.pitchY * (arrayConfig.config.elementsY-1) / 2,0);
    }
  }
}
