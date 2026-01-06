/**
 * AlephScript Angular Module
 * Provides services and components for AlephScript integration
 */

import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AlephScriptService } from './alephscript.service';
import { RxjsSocketBridge } from './rxjs-socket-bridge.service';
import { 
  AlephConnectionStatusComponent,
  AlephMessageDisplayComponent 
} from './components';
import { 
  ALEPH_SCRIPT_CONFIG, 
  AlephScriptAngularConfig 
} from './types';

@NgModule({
  imports: [
    CommonModule,
    AlephConnectionStatusComponent,
    AlephMessageDisplayComponent
  ],
  exports: [
    AlephConnectionStatusComponent,
    AlephMessageDisplayComponent
  ],
  providers: [
    AlephScriptService,
    RxjsSocketBridge
  ]
})
export class AlephScriptModule {
  /**
   * Configure AlephScript module with custom configuration
   */
  static forRoot(config: AlephScriptAngularConfig): ModuleWithProviders<AlephScriptModule> {
    return {
      ngModule: AlephScriptModule,
      providers: [
        {
          provide: ALEPH_SCRIPT_CONFIG,
          useValue: config
        }
      ]
    };
  }

  /**
   * Configure AlephScript module for feature modules
   */
  static forChild(): ModuleWithProviders<AlephScriptModule> {
    return {
      ngModule: AlephScriptModule,
      providers: []
    };
  }
}
