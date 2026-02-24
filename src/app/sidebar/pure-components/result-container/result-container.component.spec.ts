import { type ComponentFixture, TestBed } from '@angular/core/testing';
import * as menuLeft from '../sidebar-container/sidebar-container.component.metadata' ;

import { describe, beforeEach, it, expect } from 'vitest';
import { SidebarContainerComponent } from '../sidebar-container/sidebar-container.component';

describe('SidebarContainerComponent', () => {
  let component: SidebarContainerComponent;
  let fixture: ComponentFixture<SidebarContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(menuLeft.moduleMetaData)
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
