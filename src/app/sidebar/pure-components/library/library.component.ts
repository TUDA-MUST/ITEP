import { Component, input } from '@angular/core';

import { ArrayConfig } from 'src/app/store/store.service';
import { CitationComponent } from '../citation/citation.component';

@Component({
  selector: 'app-library',
  imports: [CitationComponent],
  templateUrl: './library.component.html',
  styleUrl: './library.component.scss'
})
export class LibraryComponent {
  presets = input<ArrayConfig[]>([]);
}
