import {
  type AfterContentChecked,
  type AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  HostListener,
  inject,
  type OnInit,
  signal,
} from '@angular/core';

import { excitationBufferInclude } from '../../../utils/excitationbuffer';
import { BabylonConsumer, implementsOnSceneCreated } from '../../interfaces/lifecycle';

import { Angle } from '@babylonjs/core/Maths/math.path';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { AxesViewer } from '@babylonjs/core/Debug/axesViewer';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { ShaderStore } from '@babylonjs/core/Engines/shaderStore';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';

import '@babylonjs/core/Engines/WebGPU/Extensions/engine.computeShader';

import { diff } from 'src/app/utils/utils';
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'canvas[babylonsjsview]',
  exportAs: 'babylon',
  standalone: true,
})
export class BabylonJSViewComponent implements AfterViewChecked, OnInit, AfterContentChecked {
  canvasRef = inject<ElementRef<HTMLCanvasElement>>(ElementRef);
  readonly renderers = contentChildren(BabylonConsumer);

  updateRenderers = (() => {
    let prev: BabylonConsumer[] = [];
    return effect(() => {
      const next = this.renderers();
      const scene = this.scene();
      if (scene) {
        const { added } = diff(prev, next);
        for (const renderer of added) {
          if (implementsOnSceneCreated(renderer)) {
            renderer.ngxSceneCreated(scene);
          }
        }
        prev = [...next];
      }
    });
  })();

  engine: WebGPUEngine | NullEngine;
  public readonly scene = signal<Scene | null>(null);
  camera: ArcRotateCamera;

  private elRef = inject(ElementRef);

  ngAfterContentChecked(): void {
    const scene = this.scene();
    if (scene) {
      this.engine.beginFrame();
      scene.render();
      this.engine.endFrame();
    }
  }

  ngAfterViewChecked(): void {
    const scene = this.scene();
    if (scene) {
      this.engine.beginFrame();
      scene.render();
      this.engine.endFrame();
    }
  }

  @HostListener('window:resize')
  resize(): void {
    const ne = this.canvasRef.nativeElement;
    const { width, height } = this.elRef.nativeElement.getBoundingClientRect();
    ne.width = width;
    ne.height = height;
    this.engine.resize(true);
  }

  // FIXME: Should this be an effect?
  ngOnInit(): void {
    void this.initEngine(this.canvasRef.nativeElement)
      .then(() => this.scene()?.whenReadyAsync())
      .then(() => {
        this.engine.beginFrame();
        this.scene()?.render();
        this.engine.endFrame();
      });
  }

  async initEngine(canvas: HTMLCanvasElement) {
    if (window.WebGLRenderingContext) {
      this.engine = new WebGPUEngine(canvas, {
        adaptToDeviceRatio: true,
      });
      await this.engine.initAsync();

      // this.engine.setStencilBuffer(true);
      // this.engine.setStencilMask(0xff);
    } else {
      this.engine = new NullEngine();
    }

    const scene = this.createScene(canvas);
    scene.useRightHandedSystem = true;

    const renderingOrder = ['rayleigh', 'farfieldMesh', 'excitation', 'excitationHidden'];

    scene.setRenderingOrder(1, (meshA, meshB) => {
      const indexA = renderingOrder.indexOf(meshA.getMesh().name);
      const indexB = renderingOrder.indexOf(meshB.getMesh().name);
      return Math.sign(indexA - indexB);
    });

    scene.onBeforeRenderingGroupObservable.add(
      (groupInfo) =>
        groupInfo.renderingGroupId === 0 && this.engine.setDepthFunction(Engine.LEQUAL),
    );

    scene.onPointerDown = () => this.engine.runRenderLoop(() => this.camera.update());
    scene.onPointerUp = () => this.engine.stopRenderLoop();

    scene.onPointerObservable.add((kbInfo) => {
      if (kbInfo.type === 8) {
        //scroll
        this.camera.update();
      }
    });
    this.scene.set(scene);
    //this.scene.debugLayer.show();
    this.resize();
  }

  createScene(canvas: HTMLCanvasElement) {
    ShaderStore.IncludesShadersStoreWGSL['ExcitationBuffer'] =
      excitationBufferInclude as unknown as string;

    const scene = new Scene(this.engine);
    scene.clearColor = new Color4(0.2, 0.2, 0.2, 1.0);
    this.camera = new ArcRotateCamera(
      'Camera',
      (3 * Math.PI) / 4,
      Math.PI / 4,
      0.1,
      Vector3.Zero(),
      scene,
    );
    this.camera.lowerRadiusLimit = 0.01;
    this.camera.attachControl(canvas, true);
    this.camera.minZ = 0.001;
    this.camera.inertia = 0;
    this.camera.wheelDeltaPercentage = 0.1;
    this.camera.zoomToMouseLocation = true;

    this.camera.onViewMatrixChangedObservable.add(() => {
      this.engine.beginFrame();
      scene.render();
      this.engine.endFrame();
    });

    new HemisphericLight('light1', new Vector3(0, 1, 0), scene);

    scene.registerBeforeRender(() => {
      // this.transducerMaterial.setFloat(
      //   'globalPhase',
      //   Angle.FromDegrees(phase).radians()
      // );
      // this.rayleighMaterial.setFloat(
      //   'globalPhase',
      //   Angle.FromDegrees(phase).radians()
      // );
      // this.rayleighMaterial.setFloat('t', Angle.FromDegrees(phase).radians());
    });

    const xAxis = new Vector3(1, 0, 0).normalize();
    const yAxis = new Vector3(0, 1, 0).normalize();

    const axis = new AxesViewer(scene, 0.005);
    axis.xAxis.rotate(yAxis, Angle.FromDegrees(-90).radians());
    axis.yAxis.rotate(xAxis, Angle.FromDegrees(90).radians());
    axis.zAxis.rotate(xAxis, Angle.FromDegrees(-90).radians());

    return scene;
  }
}
