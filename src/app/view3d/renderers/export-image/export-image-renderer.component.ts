import { ChangeDetectionStrategy, Component, OnDestroy, inject } from '@angular/core';
import { TransducerBufferConsumer } from '../../shared/transducer-buffer.component';
import type { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Tools } from '@babylonjs/core/Misc/tools';

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
      const canvas = engine.getRenderingCanvas() as HTMLCanvasElement | null;
      if (!canvas) {
        console.warn('No rendering canvas available to export rayleigh image');
        return;
      }

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

      // Compute bounding box corners in world space
      const pts: Vector3[] = [];
      for (const m of targetMeshes) {
        const bi = m.getBoundingInfo().boundingBox;
        const minW = bi.minimumWorld;
        const maxW = bi.maximumWorld;
        const corners = [
          new Vector3(minW.x, minW.y, minW.z),
          new Vector3(minW.x, minW.y, maxW.z),
          new Vector3(minW.x, maxW.y, minW.z),
          new Vector3(minW.x, maxW.y, maxW.z),
          new Vector3(maxW.x, minW.y, minW.z),
          new Vector3(maxW.x, minW.y, maxW.z),
          new Vector3(maxW.x, maxW.y, minW.z),
          new Vector3(maxW.x, maxW.y, maxW.z),
        ];
        pts.push(...corners);
      }

      // Save enabled state and hide everything except target meshes
      const states = scene.meshes.map((m) => ({ m, enabled: m.isEnabled() }));
      for (const s of states) {
        if (!targetMeshes.includes(s.m)) s.m.setEnabled(false);
      }

      // Resize canvas to target size for high-res render
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;
      const oldStyleWidth = canvas.style.width;
      const oldStyleHeight = canvas.style.height;
      canvas.width = targetSize;
      canvas.height = targetSize;
      canvas.style.width = `${targetSize}px`;
      canvas.style.height = `${targetSize}px`;
      try {
        // Notify engine about resize (pass true to adapt device ratio like elsewhere)
        // @ts-ignore engine.resize exists
        engine.resize(true);
      } catch (e) {
        // ignore
      }

      // Project points into the high-res viewport
      const viewport = new Viewport(0, 0, targetSize, targetSize);
      const projected = pts.map((p) => Vector3.Project(p, Matrix.Identity(), camera.getViewMatrix(), camera.getProjectionMatrix(), viewport));

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of projected) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }

      const pad = 2;
      const sx = Math.max(0, Math.floor(minX) - pad);
      const sy = Math.max(0, Math.floor(minY) - pad);
      const sw = Math.max(1, Math.min(targetSize - sx, Math.ceil(maxX) - sx + pad * 2));
      const sh = Math.max(1, Math.min(targetSize - sy, Math.ceil(maxY) - sy + pad * 2));

      // Use RenderTarget-based screenshot to avoid resizing visible canvas
      try {
        const maybe = (Tools as any).CreateScreenshotUsingRenderTarget(
          engine,
          camera,
          targetSize,
          targetMeshes,
        );

        let dataUrl: string | null = null;
        if (maybe && typeof (maybe as Promise<string>).then === 'function') {
          dataUrl = await maybe;
        } else if (typeof maybe === 'string') {
          dataUrl = maybe;
        } else if (typeof maybe === 'undefined') {
          // Some builds accept a callback before renderList param: (engine,camera,size,callback,renderList)
          let finished = false;
          (Tools as any).CreateScreenshotUsingRenderTarget(engine, camera, targetSize, (d: string) => {
            if (finished) return;
            finished = true;
            const a = document.createElement('a');
            a.href = d;
            a.download = `rayleigh-${Date.now()}.png`;
            a.click();
          }, targetMeshes);
        }

        if (dataUrl) {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `rayleigh-${Date.now()}.png`;
          a.click();
        }
      } catch (e) {
        console.error('RenderTarget screenshot failed, falling back to canvas crop', e);

        // Fallback: render to current canvas and crop as before
        engine.beginFrame();
        scene.render();
        engine.endFrame();

        const data = canvas.toDataURL('image/png');
        const img = await this.loadImage(data);
        const off = document.createElement('canvas');
        off.width = sw;
        off.height = sh;
        const ctx = off.getContext('2d')!;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

        off.toBlob((blob) => {
          if (!blob) return;
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `rayleigh-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(a.href);
        }, 'image/png');
      }

      // Restore original states
      for (const s of states) s.m.setEnabled(s.enabled);

      // Re-render to restore UI
      engine.beginFrame();
      scene.render();
      engine.endFrame();
    } catch (e) {
      console.error('Failed to export rayleigh image', e);
    }
  }

  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }
}
