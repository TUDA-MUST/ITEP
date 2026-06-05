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

      // Compute world-space corners of the combined bounding box for target meshes
      const pts = [] as Vector3[];
      for (const m of targetMeshes) {
        const bi = m.getBoundingInfo().boundingBox;
        const minW = bi.minimumWorld;
        const maxW = bi.maximumWorld;
        pts.push(new Vector3(minW.x, minW.y, minW.z));
        pts.push(new Vector3(minW.x, minW.y, maxW.z));
        pts.push(new Vector3(minW.x, maxW.y, minW.z));
        pts.push(new Vector3(minW.x, maxW.y, maxW.z));
        pts.push(new Vector3(maxW.x, minW.y, minW.z));
        pts.push(new Vector3(maxW.x, minW.y, maxW.z));
        pts.push(new Vector3(maxW.x, maxW.y, minW.z));
        pts.push(new Vector3(maxW.x, maxW.y, maxW.z));
      }

      // Determine a reasonable normal using first mesh triangle if possible
      let normal = new Vector3(0, 0, 1);
      const first = targetMeshes[0];
      const positions = (first.getVerticesData as any)('position') as number[] | undefined;
      if (positions && positions.length >= 9) {
        const p0 = new Vector3(positions[0], positions[1], positions[2]);
        const p1 = new Vector3(positions[3], positions[4], positions[5]);
        const p2 = new Vector3(positions[6], positions[7], positions[8]);
        const wm = first.getWorldMatrix();
        const p0w = Vector3.TransformCoordinates(p0, wm);
        const p1w = Vector3.TransformCoordinates(p1, wm);
        const p2w = Vector3.TransformCoordinates(p2, wm);
        normal = Vector3.Cross(p1w.subtract(p0w), p2w.subtract(p0w)).normalize();
        if (normal.lengthSquared() === 0) {
          normal = new Vector3(0, 0, 1);
        }
      }

      // Choose camera axes: right and up perpendicular to normal
      let up = new Vector3(0, 1, 0);
      if (Math.abs(Vector3.Dot(up, normal)) > 0.99) {
        up = new Vector3(0, 0, 1);
      }
      const rightAxis = Vector3.Cross(up, normal).normalize();
      const camUp = Vector3.Cross(normal, rightAxis).normalize();

      // Compute center first
      let center = new Vector3(0, 0, 0);
      for (const p of pts) center = center.add(p);
      center = center.scale(1 / pts.length);

      // Project bbox corners onto camera axes (relative to center) to get ortho bounds
      let minR = Infinity,
        minU = Infinity,
        maxR = -Infinity,
        maxU = -Infinity;
      for (const p of pts) {
        const rel = p.subtract(center);
        const r = Vector3.Dot(rel, rightAxis);
        const u = Vector3.Dot(rel, camUp);
        minR = Math.min(minR, r);
        minU = Math.min(minU, u);
        maxR = Math.max(maxR, r);
        maxU = Math.max(maxU, u);
      }

      // Use computed bounds exactly (no styling padding)
      const left = minR;
      const rightBound = maxR;
      const top = maxU;
      const bottom = minU;

      // Shift camera center so world origin maps to top-center of the image
      const origin = new Vector3(0, 0, 0);
      const relOrigin = origin.subtract(center);
      const r_o = Vector3.Dot(relOrigin, rightAxis);
      const u_o = Vector3.Dot(relOrigin, camUp);
      const desired_r = (minR + maxR) / 2;
      const desired_u = maxU; // top
      const delta = rightAxis.scale(r_o - desired_r).add(camUp.scale(u_o - desired_u));
      const camCenter = center.add(delta);

      // compute radius to place camera sufficiently far from plane (use camCenter)
      let maxDist = 0;
      for (const p of pts) {
        const d = Vector3.Distance(camCenter, p);
        if (d > maxDist) maxDist = d;
      }
      const distance = Math.max(0.5, maxDist * 3);

      const rtCam = new FreeCamera('rayleighRTCam', camCenter.add(normal.scale(distance)), scene);
      rtCam.setTarget(camCenter);
      rtCam.mode = Camera.ORTHOGRAPHIC_CAMERA;
      // tighten near/far to ensure plane in view
      rtCam.minZ = 0.0001;
      rtCam.maxZ = distance * 10;
      rtCam.orthoLeft = left;
      rtCam.orthoRight = rightBound;
      rtCam.orthoTop = top;
      rtCam.orthoBottom = bottom;

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
      // dispose temporary camera
      rtCam.dispose();
    } catch (e) {
      console.error('Failed to export rayleigh image via RenderTarget', e);
      throw e;
    }
  }
}
