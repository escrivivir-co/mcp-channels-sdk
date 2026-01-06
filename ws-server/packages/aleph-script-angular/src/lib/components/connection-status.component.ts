/**
 * Connection Status Component
 * Shows current AlephScript connection status with visual indicators
 */

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AlephScriptService } from '../alephscript.service';
import { ConnectionStatus } from '@alephscript/core-browser';

@Component({
  selector: 'aleph-connection-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="aleph-connection-status" [class]="'status-' + connectionStatus">
      <div class="status-indicator">
        <div class="status-dot" [class]="'dot-' + connectionStatus"></div>
        <span class="status-text">{{ getStatusText() }}</span>
      </div>
      
      <div class="status-details" *ngIf="showDetails">
        <div class="detail-item">
          <span class="label">Status:</span>
          <span class="value">{{ connectionStatus | titlecase }}</span>
        </div>
        <div class="detail-item" *ngIf="clientStatus">
          <span class="label">Room:</span>
          <span class="value">{{ clientStatus.client?.roomName || 'N/A' }}</span>
        </div>
        <div class="detail-item" *ngIf="clientStatus">
          <span class="label">UI Type:</span>
          <span class="value">{{ clientStatus.client?.uiType || 'N/A' }}</span>
        </div>
        <div class="detail-item" *ngIf="isReconnecting">
          <span class="label">Reconnecting:</span>
          <span class="value reconnecting">Yes</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .aleph-connection-status {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      background: #fafafa;
      font-family: 'Roboto', sans-serif;
      font-size: 14px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      transition: all 0.3s ease;
    }

    .dot-connected {
      background-color: #4caf50;
      box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
    }

    .dot-connecting {
      background-color: #ff9800;
      animation: pulse 1.5s infinite;
    }

    .dot-disconnected {
      background-color: #9e9e9e;
    }

    .dot-error {
      background-color: #f44336;
    }

    .dot-offline {
      background-color: #795548;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .status-text {
      font-weight: 500;
      color: #333;
    }

    .status-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      color: #333;
    }

    .reconnecting {
      color: #ff9800;
      animation: pulse 1s infinite;
    }

    .status-connected {
      border-color: #4caf50;
      background-color: #f1f8e9;
    }

    .status-error {
      border-color: #f44336;
      background-color: #ffebee;
    }

    .status-offline {
      border-color: #795548;
      background-color: #efebe9;
    }
  `]
})
export class AlephConnectionStatusComponent implements OnInit, OnDestroy {
  @Input() showDetails = true;
  
  connectionStatus: ConnectionStatus = 'disconnected';
  isReconnecting = false;
  clientStatus: any = null;
  
  private destroy$ = new Subject<void>();

  constructor(private alephService: AlephScriptService) {}

  ngOnInit(): void {
    // Subscribe to connection status
    this.alephService.connectionStatus.pipe(
      takeUntil(this.destroy$)
    ).subscribe((status: ConnectionStatus) => {
      this.connectionStatus = status;
    });

    // Subscribe to reconnection status
    this.alephService.isReconnecting.pipe(
      takeUntil(this.destroy$)
    ).subscribe((reconnecting: boolean) => {
      this.isReconnecting = reconnecting;
    });

    // Get client status
    this.clientStatus = this.alephService.getStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStatusText(): string {
    if (this.isReconnecting) {
      return 'Reconnecting...';
    }

    switch (this.connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      case 'offline':
        return 'Offline Mode';
      default:
        return 'Unknown';
    }
  }
}
