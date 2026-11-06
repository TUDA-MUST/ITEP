import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LiteRendererViewComponent } from './view3d/smart-components/lite-renderer-view/lite-renderer-view.component';
import { ResultContainerComponent } from './sidebar/pure-components/result-container/result-container.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SidebarContainerComponent } from './sidebar/pure-components/sidebar-container/sidebar-container.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    SidebarContainerComponent,
    LiteRendererViewComponent,
    ResultContainerComponent,
    MatToolbarModule,
  ],
})
export class AppComponent {}
