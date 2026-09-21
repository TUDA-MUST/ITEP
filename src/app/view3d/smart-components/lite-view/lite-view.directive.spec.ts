import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type * as BabylonLite from '@babylonjs/lite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const lite = vi.hoisted(() => ({
  registerScene: vi.fn(async () => undefined),
  renderFrame: vi.fn(),
  resizeEngine: vi.fn(),
}));

vi.mock('@babylonjs/lite', async (importOriginal) => ({
  ...(await importOriginal<typeof BabylonLite>()),
  addToScene: vi.fn(),
  attachControl: vi.fn(() => vi.fn()),
  createArcRotateCamera: vi.fn(() => ({
    nearPlane: 0,
    lowerRadiusLimit: 0,
    inertia: 0,
    panningInertia: 0,
  })),
  createEngine: vi.fn(async () => ({ id: 'engine' })),
  createHemisphericLight: vi.fn(() => ({})),
  createSceneContext: vi.fn(() => ({ clearColor: null, camera: null })),
  disposeEngine: vi.fn(),
  disposeScene: vi.fn(),
  enableMaterialStencil: vi.fn(),
  registerScene: lite.registerScene,
  renderFrame: lite.renderFrame,
  resizeEngine: lite.resizeEngine,
}));

import { LiteViewDirective } from './lite-view.directive';

@Component({
  template: '<canvas liteview></canvas>',
  imports: [LiteViewDirective],
})
class TestHostComponent {}

describe('LiteViewDirective', () => {
  let animationFrames: Map<number, FrameRequestCallback>;
  let nextFrameId: number;
  let resizeCallback: ResizeObserverCallback;
  let directive: LiteViewDirective;
  let canvas: HTMLCanvasElement;
  let fixture: ReturnType<typeof TestBed.createComponent<TestHostComponent>>;

  beforeEach(async () => {
    animationFrames = new Map();
    nextFrameId = 1;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = nextFrameId++;
      animationFrames.set(id, callback);
      return id;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      animationFrames.delete(id);
    });

    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }
        observe(): void {}
        disconnect(): void {}
        unobserve(): void {}
      },
    );

    lite.registerScene.mockClear();
    lite.renderFrame.mockClear();
    lite.resizeEngine.mockClear();

    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    canvas = fixture.nativeElement.querySelector('canvas');
    directive = fixture.debugElement.children[0].injector.get(LiteViewDirective);
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function start(): Promise<void> {
    directive.initializeCamera();
    await directive.start();
  }

  function runFrame(now = performance.now() + 16): void {
    const callback = [...animationFrames.values()][0];
    animationFrames.clear();
    callback(now);
  }

  it('registers the scene and renders one coalesced initial frame on demand', async () => {
    directive.requestRender();
    expect(animationFrames.size).toBe(0);

    await start();
    directive.requestRender();
    directive.requestRender();

    expect(lite.registerScene).toHaveBeenCalledOnce();
    expect(animationFrames.size).toBe(1);

    runFrame();

    expect(lite.resizeEngine).toHaveBeenCalledOnce();
    expect(lite.renderFrame).toHaveBeenCalledOnce();
    expect(lite.renderFrame.mock.calls[0][1]).toBeGreaterThanOrEqual(0);
    expect(canvas.classList.contains('lite-view-ready')).toBe(true);
  });

  it('requests frames for resize and camera interaction', async () => {
    await start();
    runFrame();

    resizeCallback([], {} as ResizeObserver);
    expect(animationFrames.size).toBe(1);
    runFrame();

    canvas.dispatchEvent(new WheelEvent('wheel'));
    expect(animationFrames.size).toBe(1);
    runFrame();

    canvas.dispatchEvent(new PointerEvent('pointerdown'));
    canvas.dispatchEvent(new PointerEvent('pointermove'));
    expect(animationFrames.size).toBe(1);
  });

  it('cancels a pending frame and cannot render after destruction', async () => {
    await start();
    const callback = [...animationFrames.values()][0];

    fixture.destroy();
    expect(animationFrames.size).toBe(0);

    callback(performance.now() + 16);
    expect(lite.renderFrame).not.toHaveBeenCalled();
  });
});
