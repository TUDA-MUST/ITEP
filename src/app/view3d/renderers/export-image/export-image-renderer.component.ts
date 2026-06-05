import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { TransducerBufferConsumer } from '../../shared/transducer-buffer.component';
import type { Scene } from '@babylonjs/core/scene';
import { Tools } from '@babylonjs/core/Misc/tools';
// ScreenshotTools registers read-back helpers required by RenderTarget operations; import for side-effects
import '@babylonjs/core/Misc/screenshotTools';
import { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture';
import { Engine } from '@babylonjs/core/Engines/engine';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

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
      const engine = scene.getEngine();
      const camera = scene.activeCamera;
      if (!camera) {
        console.warn('No active camera');
        return;
      }

      // Find rayleigh meshes that are currently enabled
      const targetMeshes = scene.meshes.filter(
        (m) => (m.name === 'rayleigh' || m.name === 'cubeCut') && m.isEnabled(),
      );
      if (targetMeshes.length === 0) {
        console.warn('No rayleigh mesh found to export');
        return;
      }

      // Fixed high-res size
      const targetSize = 1024;

      // Create an orthographic camera that frames the Rayleigh rectangle: X: [0,1], Y: [-0.5,0.5]
      const rtCam = new FreeCamera('rayleighRTCam', new Vector3(0.5, 0, 2), scene);
      rtCam.setTarget(new Vector3(0.5, 0, 0));
      rtCam.mode = Camera.ORTHOGRAPHIC_CAMERA;
      // Ortho bounds in world units
      rtCam.orthoLeft = 0;
      rtCam.orthoRight = 1;
      rtCam.orthoTop = 0.5;
      rtCam.orthoBottom = -0.5;
      // Create a RenderTargetTexture and render only the rayleigh meshes into it using the RT camera
      const rt = new RenderTargetTexture('rayleighRT', targetSize, scene, false, true, Engine.TEXTURETYPE_UNSIGNED_INT);
      rt.renderList = targetMeshes;
      rt.activeCamera = rtCam;

      // Render once to the RT
      await rt.render(true);

      // readPixels is available on RT in recent Babylon versions
      if (typeof (rt as any).readPixels !== 'function') {
        console.error('RenderTargetTexture.readPixels not available in this Babylon build');
        rt.dispose();
        return;
      }

      const pixels: Uint8Array = await (rt as any).readPixels();
      // pixels is RGBA uint8 array
      const clamped = new Uint8ClampedArray(pixels);
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
    } catch (e) {
      console.error('Failed to export rayleigh image via RenderTarget', e);
      throw e;
    }
  }
}
