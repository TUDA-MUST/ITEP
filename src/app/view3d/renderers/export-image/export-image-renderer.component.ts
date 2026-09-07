import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import type { OnDestroy } from '@angular/core';
import {
  addToScene,
  captureScreenshot,
  createFreeCamera,
  createMeshFromData,
  createSceneContext,
  createSurface,
  createTransformNode,
  disposeScene,
  disposeSurface,
  enableOrthographicCamera,
  registerScene,
  setShaderUniform,
  unregisterScene,
  waitForGpuIdle,
  type SceneContext,
  type ShaderMaterial,
  type SurfaceContext,
} from '@babylonjs/lite';

import type { Environment } from 'src/app/core/environment';
import type { ResultSet } from 'src/app/store/rayleigh.state';
import type { Transducer } from 'src/app/store/store.service';
import { createRayleighLiteMaterial, LiteResultAspect } from '../../materials/rayleigh.material';
import { colormapTextureSampleRows } from '../../shared/colormap-texture';
import { LiteRendererResourcesDirective } from '../../smart-components/lite-renderer-resources/lite-renderer-resources.directive';
import { waveNumber } from '../../shared/wave-number';
import { rayleighGeometry } from '../rayleigh-integral/rayleigh.geometry';

const exportImageSize = 1024;
const quarterTurn = Math.SQRT1_2;

@Component({
  selector: 'app-export-image-renderer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportImageRendererComponent implements OnDestroy {
  private readonly resources = inject(LiteRendererResourcesDirective);

  readonly transducers = input<Transducer[] | null>(null);
  readonly environment = input<Environment | null>(null);
  readonly resultSet = input<ResultSet>('XZPlane');
  readonly aspect = input<number | null>(null);
  readonly globalPhase = input(0);
  readonly enabled = input(false);

  private listening = false;
  private readonly handler = () => void this.exportImage();

  private readonly initialize = effect(() => {
    const context = this.resources.bufferContext();
    if (!context || this.listening) return;
    this.listening = true;
    window.addEventListener('export-rayleigh', this.handler);
  });

  private async exportImage(): Promise<void> {
    const context = this.resources.bufferContext();
    const resultSet = this.resultSet();
    if (!context || !this.enabled()) return;

    const canvas = document.createElement('canvas');
    canvas.width = exportImageSize;
    canvas.height = exportImageSize;
    canvas.style.cssText = [
      'position:fixed',
      'left:-10000px',
      'top:0',
      `width:${exportImageSize}px`,
      `height:${exportImageSize}px`,
      'pointer-events:none',
    ].join(';');
    document.body.append(canvas);

    const surface = createSurface(context.engine, canvas, { msaaSamples: 1 });
    const scene = createSceneContext(surface);
    scene.clearColor = { ...context.scene.clearColor };

    try {
      const rig = this.createCameraRig(resultSet);
      const camera = createFreeCamera({ x: 0, y: 0.5, z: 1 }, { x: 0, y: 0.5, z: 0 });
      camera.parent = rig;
      camera.nearPlane = 0.0001;
      camera.farPlane = 2;
      enableOrthographicCamera(camera, {
        left: -0.5,
        right: 0.5,
        bottom: -0.5,
        top: 0.5,
      });
      addToScene(scene, rig);
      addToScene(scene, camera);
      scene.camera = camera;

      // Lite nodes belong to one scene. Recreate the selected result instead
      // of transferring or mutating the live mesh.
      const geometry = rayleighGeometry(resultSet);
      const mesh = createMeshFromData(
        context.engine,
        `rayleigh-export-${resultSet}`,
        geometry.positions,
        new Float32Array(geometry.positions.length),
        geometry.indices,
      );
      mesh.material = this.createMaterial();
      mesh.pickable = false;
      addToScene(scene, mesh);
      await registerScene(scene);

      const screenshot = await captureScreenshot(surface);
      this.downloadImage(
        screenshot.data,
        screenshot.width,
        screenshot.height,
        `rayleigh-${Date.now()}.png`,
      );
    } catch (error) {
      console.error('Failed to export the Lite Rayleigh image', error);
    } finally {
      await this.disposeSurface(scene, surface, canvas);
    }
  }

  private createMaterial(): ShaderMaterial {
    const context = this.resources.bufferContext()!;
    const material = createRayleighLiteMaterial(context.colormap, context.excitation.storageBuffer);
    const environment = this.environment();
    setShaderUniform(material, 'numElements', (this.transducers() ?? []).length);
    setShaderUniform(material, 'globalPhase', this.globalPhase());
    setShaderUniform(material, 'k', environment ? waveNumber(environment) : 0);
    setShaderUniform(material, 'viewmode', this.aspect() ?? LiteResultAspect.Elongation);
    setShaderUniform(material, 'elongationColormapY', colormapTextureSampleRows.coolwarm);
    setShaderUniform(material, 'magnitudeColormapY', colormapTextureSampleRows.viridis);
    setShaderUniform(material, 'phaseColormapY', colormapTextureSampleRows.twilightShifted);
    return material;
  }

  private async disposeSurface(
    scene: SceneContext,
    surface: SurfaceContext,
    canvas: HTMLCanvasElement,
  ): Promise<void> {
    // Wait for submitted work before destroying the auxiliary swapchain.
    unregisterScene(scene);
    await waitForGpuIdle(surface.engine);
    disposeScene(scene);
    disposeSurface(surface);
    canvas.remove();
  }

  private createCameraRig(resultSet: ResultSet) {
    if (resultSet !== 'XZPlane') {
      // Local +Y -> world +Z and local -Z -> world -X.
      return createTransformNode('rayleigh-export-rig', 0, 0, 0, 0.5, 0.5, 0.5, 0.5);
    }
    // Local +Y -> world +Z and local -Z -> world -Y.
    return createTransformNode('rayleigh-export-rig', 0, 0, 0, 0, quarterTurn, quarterTurn, 0);
  }

  private downloadImage(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    name: string,
  ): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const pixels = new Uint8ClampedArray(data.length);
    pixels.set(data);
    canvas.getContext('2d')?.putImageData(new ImageData(pixels, width, height), 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  }

  ngOnDestroy(): void {
    window.removeEventListener('export-rayleigh', this.handler);
  }
}
