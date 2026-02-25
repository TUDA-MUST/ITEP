import { enableProdMode } from '@angular/core';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { bootstrapApplication } from '@angular/platform-browser';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideRouter, type Routes, withComponentInputBinding } from '@angular/router';
import { SetupContainerComponent } from './app/sidebar/smart-components/setup-container/setup-container.component';
import { LibraryContainerComponent } from './app/sidebar/smart-components/library-container/library-container.component';

if (environment.production) {
  enableProdMode();
}

const routes: Routes = [
  { path: 'library', component: LibraryContainerComponent },
  { path: 'library/:libraryIndex', component: LibraryContainerComponent },
  { path: 'setup', component: SetupContainerComponent },
  { path: '', redirectTo: '/library', pathMatch: 'full' },
];

bootstrapApplication(AppComponent, {
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
    provideRouter(routes, withComponentInputBinding()),
  ],
}).catch((err) => console.error(err));
