import {
  ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

import { version } from '../../../../../package.json';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-sidebar-container',
    templateUrl: './sidebar-container.component.html',
    styleUrl: './sidebar-container.component.scss',
    imports: [        
        MatIcon,
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
    ]
})
export class SidebarContainerComponent {
    public version = version;
}
