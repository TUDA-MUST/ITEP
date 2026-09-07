import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LiteRendererViewComponent } from '../lite-renderer-view/lite-renderer-view.component';

@Component({
  selector: 'app-view3d',
  templateUrl: './view3d.component.html',
  styleUrl: './view3d.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiteRendererViewComponent],
})
export class View3dComponent {}
