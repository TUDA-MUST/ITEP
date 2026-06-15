import { ChangeDetectionStrategy, Component, input, type OnDestroy } from '@angular/core';
import { TransducerBufferConsumer } from '../../shared/transducer-buffer.component';
import type { Scene } from '@babylonjs/core/scene';
// ScreenshotTools registers read-back helpers required by RenderTarget operations; import for side-effects
import '@babylonjs/core/Misc/screenshotTools';
import { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture';
import { Engine } from '@babylonjs/core/Engines/engine';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { ResultSet } from 'src/app/store/rayleigh.state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-export-image-renderer',
  template: '<ng-content />',
  standalone: true,
  providers: [{ provide: TransducerBufferConsumer, useExisting: ExportImageRendererComponent }],
})
export class ExportImageRendererComponent extends TransducerBufferConsumer implements OnDestroy {
  private sceneRef: Scene | null = null;
  private handler = () => void this.exportImage();

  readonly resultSet = input<ResultSet | null>(null);

  ngxSceneAndBufferCreated(scene: Scene): void {
    this.sceneRef = scene;
    window.addEventListener('export-rayleigh', this.handler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('export-rayleigh', this.handler);
  }

  private async exportImage(): Promise<void> {
    if (!this.sceneRef) return;

    try {
      const scene = this.sceneRef;
      const camera = scene.activeCamera;
      if (!camera) {
        console.warn('No active camera');
        return;
      }

      const resultSet = this.resultSet();

      const cameraConfig = {
        orthoLeft: -0.5,
        orthoRight: 0.5,
        // Why are these not 0 - 1?
        orthoTop: 0.5,
        orthoBottom: -0.5,
      };

      const pos = resultSet === 'XZPlane' ? new Vector3(0, 1, 0.5) : new Vector3(1, 0, 0.5);
      const target = new Vector3(0, 0, 0.5);
      const up = resultSet === 'XZPlane' ? new Vector3(0, 0, 1) : new Vector3(0, 0, 1);

      const targetSize = 1024;

      // Find rayleigh meshes that are currently enabled
      const targetMeshes = scene.meshes.filter(
        (m) => (m.name === 'rayleigh' || m.name === 'cubeCut') && m.isEnabled(),
      );
      if (targetMeshes.length === 0) {
        console.warn('No rayleigh mesh found to export');
        return;
      }

      const rtCam = new FreeCamera('rayleighRTCam', pos, scene);
      // align camera up vector to computed camUp so image axes match projections
      rtCam.upVector = up;
      rtCam.setTarget(target);
      rtCam.mode = Camera.ORTHOGRAPHIC_CAMERA;
      // tighten near/far to ensure plane in view
      rtCam.minZ = 0.0001;
      rtCam.maxZ = 2;

      Object.assign(rtCam, cameraConfig);

      // Create a RenderTargetTexture and render only the rayleigh meshes into it using the RT camera
      const rt = new RenderTargetTexture(
        'rayleighRT',
        targetSize,
        scene,
        false,
        true,
        Engine.TEXTURETYPE_UNSIGNED_INT,
      );
      rt.renderList = targetMeshes;
      rt.activeCamera = rtCam;

      // Render once to the RT
      await rt.render(true);

      const pixelsPromise = rt.readPixels();
      if (!pixelsPromise) {
        console.error('RenderTargetTexture.readPixels is not available in this Babylon build');
        rt.dispose();
        rtCam.dispose();
        return;
      }

      const pixels = await pixelsPromise;

      // Normalize to an ArrayBuffer-backed clamped array for ImageData in strict TS mode
      const byteView = new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength);
      const clamped = new Uint8ClampedArray(byteView.length);
      clamped.set(byteView);
      const imageData = new ImageData(clamped, targetSize, targetSize);

      const off = document.createElement('canvas');
      off.width = targetSize;
      off.height = targetSize;
      const ctx = off.getContext('2d')!;
      ctx.putImageData(imageData, 0, 0);

      off.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `rayleigh-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');

      rt.dispose();
      // dispose temporary camera
      rtCam.dispose();
    } catch (e) {
      console.error('Failed to export rayleigh image via RenderTarget', e);
      throw e;
    }
  }
}
