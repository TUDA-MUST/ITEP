import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { View3dComponent } from './view3d/smart-components/view3d/view3d.component';
import { MockComponent } from 'ng-mocks';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { SidebarContainerComponent } from './sidebar/pure-components/sidebar-container/sidebar-container.component';

import { describe, beforeEach, it, expect } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatExpansionModule,
        MatListModule,
        MatSidenavModule,
        MatButtonToggleModule,
        MatIconModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
      ],
      declarations: [
        AppComponent,
        MockComponent(SidebarContainerComponent),
        MockComponent(View3dComponent),
      ],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
