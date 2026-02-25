import {
  ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { type Citation } from 'src/app/store/store.service';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-citation',
  imports: [
    MatIcon,
    RouterLink
  ],
  templateUrl: './citation.component.html',
  styleUrl: './citation.component.scss'
})
export class CitationComponent {
  readonly citation = input<Citation | null>();
  readonly citationIndex = input<number>(0);
}
