import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { type ArrayConfig } from 'src/app/store/store.service';
import { CitationComponent } from '../citation/citation.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-library',
  imports: [CitationComponent],
  templateUrl: './library.component.html',
  styleUrl: './library.component.scss',
})
export class LibraryComponent {
  readonly presets = input<ArrayConfig[]>([]);
}
