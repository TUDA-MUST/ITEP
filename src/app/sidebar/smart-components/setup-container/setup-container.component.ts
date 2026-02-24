import { Component, computed, inject } from '@angular/core';

import { ArrayConfigComponent } from '../../smart-components/array-config/array-config.component';
import { BeamformingComponent } from '../../smart-components/beamforming/beamforming.component';
import { EnvironmentComponent } from '../../pure-components/environment/environment.component';
import { ExcitationComponent } from '../../pure-components/excitation/excitation.component';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { TransducerComponent } from '../../pure-components/transducer/transducer.component';
import { StoreService } from 'src/app/store/store.service';

@Component({
  selector: 'app-setup-container',
  imports: [
    ArrayConfigComponent,
    BeamformingComponent,
    EnvironmentComponent,
    ExcitationComponent,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelTitle,
    MatExpansionPanelHeader,
    MatIcon,
    TransducerComponent
  ],
  templateUrl: './setup-container.component.html',
  styleUrl: './setup-container.component.scss'
})
export class SetupContainerComponent {
    private store = inject(StoreService);
    public readonly beamformingEnabled = computed(() => this.store.beamforming().beamformingEnabled);
    public readonly environment = computed(() => this.store.arrayConfig().environment);
    public readonly arrayConfig = computed(() => this.store.arrayConfig());
}
