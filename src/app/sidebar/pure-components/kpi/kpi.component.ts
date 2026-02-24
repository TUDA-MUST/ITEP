import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ReactiveFormsModule } from '@angular/forms';

import { type PSFResult, StoreService } from 'src/app/store/store.service';

export type HoveredKpi = '' | 'HpbwAz' | 'FnbwAz' | 'SlrAz' | 'HpbwEl' | 'FnbwEl' | 'SlrEl';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kpi',
  imports: [ 
    ReactiveFormsModule,
    DecimalPipe
  ],
  templateUrl: './kpi.component.html',
  styleUrl: './kpi.component.scss'
})
export class KPIComponent {
  readonly store = inject(StoreService);
  readonly snackBar = inject(MatSnackBar);

  readonly kpis = input<PSFResult>();

  readonly hoveredKpi = output<HoveredKpi>();

    copyToClipboard(value: number|null) {
    if (value !== null) {
      navigator.clipboard.writeText(value.toString());
      this.snackBar.open(`Value ${value.toFixed(4)} copied to clipboard`, 'Close', {
        duration: 1000
      });
    }
  }
}
