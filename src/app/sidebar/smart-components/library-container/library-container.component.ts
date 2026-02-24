import { Component, computed, effect, inject, input } from '@angular/core';
import { LibraryComponent } from '../../pure-components/library/library.component';
import { StoreService } from 'src/app/store/store.service';
import { presets } from '../../../presets'

@Component({
  selector: 'app-library-container',
  imports: [
    LibraryComponent,
  ],
  templateUrl: './library-container.component.html',
  styleUrl: './library-container.component.scss'
})
export class LibraryContainerComponent {
  public presets = presets.sort((a, b) => a.citation!.year < b.citation!.year ? 1 : -1);
  private store = inject(StoreService);
  public readonly libraryIndex = input<number | null>();

  oldIndex = -1

  public loadPresetEffect = effect(() => {
    const index = this.libraryIndex();
    if (index === null || index === undefined || index === this.oldIndex) {
      return;
    }
    this.oldIndex = index;

    const preset = this.presets[index!];
    if (preset) {
      this.store.setConfig(preset);
    }
  });
  public readonly citation = computed(() => this.store.arrayConfig().citation);
}
