import { Directive, ElementRef, inject, signal } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import {
  addToScene,
  attachControl,
  createArcRotateCamera,
  createEngine,
  createHemisphericLight,
  createSceneContext,
  disposeEngine,
  disposeScene,
  enableMaterialStencil,
  registerScene,
  startEngine,
  type ArcRotateCamera,
  type EngineContext,
  type SceneContext,
} from '@babylonjs/lite';

export interface LiteViewContext {
  engine: EngineContext;
  scene: SceneContext;
  camera: ArcRotateCamera | null;
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'canvas[liteview]',
  exportAs: 'liteView',
})
export class LiteViewDirective implements OnInit, OnDestroy {
  readonly canvas = inject<ElementRef<HTMLCanvasElement>>(ElementRef).nativeElement;
  readonly context = signal<LiteViewContext | null>(null);
  private detachControls: (() => void) | null = null;
  private started = false;

  ngOnInit(): void {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    const engine = await createEngine(this.canvas);
    const scene = createSceneContext(engine);
    scene.clearColor = { r: 0.2, g: 0.2, b: 0.2, a: 1 };
    addToScene(scene, createHemisphericLight([0, 1, 0]));
    // Lite keeps stencil tree-shakeable. This must happen before scene registration.
    enableMaterialStencil();
    this.context.set({ engine, scene, camera: null });
  }

  initializeCamera(): void {
    const context = this.context();
    if (!context || context.camera) return;

    // Match the legacy scientific viewport rather than framing scene bounds.
    // Lite is left-handed while the legacy scene was right-handed. Mirror the
    // legacy orbit across X so the scientific viewport retains its left/right
    // orientation: π - 3π/4 = π/4.
    const camera = createArcRotateCamera(Math.PI / 4, Math.PI / 4, 0.1, {
      x: 0,
      y: 0,
      z: 0,
    });
    camera.nearPlane = 0.001;
    camera.lowerRadiusLimit = 0.01;
    camera.inertia = 0;
    camera.panningInertia = 0;
    addToScene(context.scene, camera);
    context.scene.camera = camera;
    this.detachControls = attachControl(camera, this.canvas, context.scene);
    this.context.set({ ...context, camera });
  }

  async start(): Promise<void> {
    const context = this.context();
    if (!context || !context.camera || this.started) return;
    this.started = true;
    await registerScene(context.scene);
    await startEngine(context.engine);
    requestAnimationFrame(() => {
      if (this.started) this.canvas.classList.add('lite-view-ready');
    });
  }

  setControlsEnabled(enabled: boolean): void {
    const context = this.context();
    if (!context?.camera) return;
    if (!enabled) {
      this.detachControls?.();
      this.detachControls = null;
      return;
    }
    if (!this.detachControls) {
      this.detachControls = attachControl(context.camera, this.canvas, context.scene);
    }
  }

  ngOnDestroy(): void {
    this.started = false;
    this.detachControls?.();
    const context = this.context();
    if (context) {
      disposeScene(context.scene);
      disposeEngine(context.engine);
    }
  }
}
