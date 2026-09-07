import { Directive, effect, inject, input, signal } from '@angular/core';
import type { OnDestroy } from '@angular/core';
import {
  createGpuPicker,
  disposePicker,
  enableDetailedPicking,
  loadTexture2D,
  pickAsync,
  type Mesh,
  type PickOptions,
  type PickingInfo,
  type Texture2D,
} from '@babylonjs/lite';

import type { BeamformingState } from 'src/app/store/beamforming.state';
import type { Transducer } from 'src/app/store/store.service';
import { LiteExcitationBuffer } from '../../materials/excitation-buffer';
import {
  LiteViewDirective,
  type LiteViewContext,
} from '../lite-view/lite-view.directive';
import { colormapTexturePath } from '../../shared/colormap-texture';

export interface LiteRendererResourcesContext extends LiteViewContext {
  colormap: Texture2D;
  excitation: LiteExcitationBuffer;
}

@Directive({
  selector: 'canvas[appLiteRendererResources]',
})
export class LiteRendererResourcesDirective implements OnDestroy {
  private readonly view = inject(LiteViewDirective);

  readonly transducers = input<Transducer[] | null>(null);
  readonly beamforming = input<BeamformingState | null>(null);
  readonly k = input<number | null>(null);

  readonly bufferContext = signal<LiteRendererResourcesContext | null>(null);
  readonly pickerReady = signal(false);
  readonly transducerMesh = signal<Mesh | null>(null);
  readonly rayleighProbeMesh = signal<Mesh | null>(null);
  readonly activeRayleighMesh = signal<Mesh | null>(null);
  readonly draggingRayleighProbe = signal(false);

  private initializing = false;
  private destroyed = false;
  private picker: ReturnType<typeof createGpuPicker> | null = null;
  private pickTail: Promise<void> = Promise.resolve();

  private readonly initialize = effect(() => {
    const viewContext = this.view.context();
    if (!viewContext || this.initializing) return;
    this.initializing = true;
    void this.initializeResources(viewContext);
  });

  private readonly update = effect(() => {
    const context = this.bufferContext();
    const transducers = this.transducers() ?? [];
    const beamforming = this.beamforming();
    const k = this.k();
    if (context) context.excitation.update(transducers, beamforming, k);
  });

  async pick(
    x: number,
    y: number,
    filter: NonNullable<PickOptions['filter']>,
  ): Promise<PickingInfo | null> {
    const request = this.pickTail.then(async () => {
      if (!this.picker) return null;
      return pickAsync(this.picker, x, y, { filter });
    });
    this.pickTail = request.then(
      () => undefined,
      () => undefined,
    );
    return request;
  }

  private async initializeResources(viewContext: LiteViewContext): Promise<void> {
    const colormap = await loadTexture2D(viewContext.engine, colormapTexturePath, {
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      minFilter: 'nearest',
      magFilter: 'nearest',
      invertY: false,
      mipMaps: false,
    });
    if (this.destroyed) return;

    const excitation = new LiteExcitationBuffer(viewContext.engine);
    this.bufferContext.set({ ...viewContext, colormap, excitation });

    // Let projected renderer effects create their scene resources before the
    // first registered frame. Lite also supports later dynamic additions.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (this.destroyed) return;

    this.view.initializeCamera();
    await this.view.start();
    if (this.destroyed) return;

    this.picker = createGpuPicker(viewContext.scene);
    enableDetailedPicking(this.picker);
    this.pickerReady.set(true);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.pickerReady.set(false);
    if (this.picker) disposePicker(this.picker);
    this.bufferContext()?.excitation.dispose();
  }
}
