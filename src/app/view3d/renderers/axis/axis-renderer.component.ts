import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { addToScene, createLineSystem } from '@babylonjs/lite';

import { LiteRendererResourcesDirective } from '../../smart-components/lite-renderer-resources/lite-renderer-resources.directive';

const axisLength = 0.005;
const headLength = axisLength * 0.25;
const headWidth = axisLength * 0.12;

@Component({
  selector: 'app-axis-renderer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AxisRendererComponent {
  private readonly resources = inject(LiteRendererResourcesDirective);
  private initialized = false;

  private readonly initialize = effect(() => {
    const context = this.resources.bufferContext();
    if (!context || this.initialized) return;
    this.initialized = true;

    const axes = [
      {
        name: 'axis-x',
        color: { r: 1, g: 0, b: 0, a: 1 },
        lines: [
          [
            { x: 0, y: 0, z: 0 },
            { x: axisLength, y: 0, z: 0 },
            { x: axisLength - headLength, y: headWidth, z: 0 },
          ],
          [
            { x: axisLength, y: 0, z: 0 },
            { x: axisLength - headLength, y: -headWidth, z: 0 },
          ],
        ],
      },
      {
        name: 'axis-y',
        color: { r: 0, g: 1, b: 0, a: 1 },
        lines: [
          [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: axisLength, z: 0 },
            { x: headWidth, y: axisLength - headLength, z: 0 },
          ],
          [
            { x: 0, y: axisLength, z: 0 },
            { x: -headWidth, y: axisLength - headLength, z: 0 },
          ],
        ],
      },
      {
        name: 'axis-z',
        color: { r: 0, g: 0, b: 1, a: 1 },
        lines: [
          [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: axisLength },
            { x: headWidth, y: 0, z: axisLength - headLength },
          ],
          [
            { x: 0, y: 0, z: axisLength },
            { x: -headWidth, y: 0, z: axisLength - headLength },
          ],
        ],
      },
    ];

    for (const axis of axes) {
      const mesh = createLineSystem(context.engine, axis);
      mesh.renderOrder = 2;
      mesh.pickable = false;
      addToScene(context.scene, mesh);
    }
  });
}
