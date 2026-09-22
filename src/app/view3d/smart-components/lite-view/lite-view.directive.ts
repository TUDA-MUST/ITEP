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
  renderFrame,
  resizeEngine,
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
  private removeInteractionListeners: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private renderFrameId: number | null = null;
  private lastFrameTime = performance.now();
  private started = false;
  private destroyed = false;
  private firstFrameRendered = false;

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
    if (this.destroyed) {
      disposeScene(scene);
      disposeEngine(engine);
      return;
    }
    this.context.set({ engine, scene, camera: null });
    this.observeCanvasSize();
    this.listenForCameraInteraction();
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
    if (!context || !context.camera || this.started || this.destroyed) return;

    await registerScene(context.scene);
    if (this.destroyed) return;

    this.started = true;
    this.lastFrameTime = performance.now();
    this.requestRender();
  }

  requestRender(): void {
    if (!this.started || this.destroyed || this.renderFrameId !== null) return;

    this.renderFrameId = requestAnimationFrame((now) => {
      this.renderFrameId = null;
      const context = this.context();
      if (!context || !this.started || this.destroyed) return;

      const deltaMs = now - this.lastFrameTime;
      this.lastFrameTime = now;
      resizeEngine(context.engine);
      renderFrame(context.engine, deltaMs);

      if (!this.firstFrameRendered) {
        this.firstFrameRendered = true;
        this.canvas.classList.add('lite-view-ready');
      }
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

  private observeCanvasSize(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => this.requestRender());
    this.resizeObserver.observe(this.canvas);
  }

  private listenForCameraInteraction(): void {
    let pointerDown = false;
    const onPointerDown = () => {
      pointerDown = true;
      this.requestRender();
    };
    const onPointerMove = () => {
      if (pointerDown) this.requestRender();
    };
    const onPointerUp = () => {
      pointerDown = false;
      this.requestRender();
    };
    const onWheel = () => this.requestRender();

    this.canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
    this.canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    this.canvas.addEventListener('pointerup', onPointerUp, { passive: true });
    this.canvas.addEventListener('pointercancel', onPointerUp, { passive: true });
    this.canvas.addEventListener('wheel', onWheel, { passive: true });
    this.removeInteractionListeners = () => {
      this.canvas.removeEventListener('pointerdown', onPointerDown);
      this.canvas.removeEventListener('pointermove', onPointerMove);
      this.canvas.removeEventListener('pointerup', onPointerUp);
      this.canvas.removeEventListener('pointercancel', onPointerUp);
      this.canvas.removeEventListener('wheel', onWheel);
    };
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.started = false;
    if (this.renderFrameId !== null) cancelAnimationFrame(this.renderFrameId);
    this.renderFrameId = null;
    this.resizeObserver?.disconnect();
    this.removeInteractionListeners?.();
    this.detachControls?.();
    const context = this.context();
    if (context) {
      disposeScene(context.scene);
      disposeEngine(context.engine);
    }
  }
}
