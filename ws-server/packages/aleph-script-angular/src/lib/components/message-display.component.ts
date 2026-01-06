/**
 * Message Display Component
 * Shows AlephScript messages with channel filtering
 */

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AlephScriptService } from '../alephscript.service';
import { MessageChannel } from '../types';
import { AlephMessage } from '@alephscript/core-browser';

@Component({
  selector: 'aleph-message-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="aleph-message-display">
      <div class="message-header" *ngIf="showHeader">
        <h3>{{ title }}</h3>
        <div class="channel-filter" *ngIf="showChannelFilter">
          <select [value]="selectedChannel" (change)="onChannelChange($event)">
            <option value="all">All Channels</option>
            <option value="SYSTEM">System</option>
            <option value="APPLICATION">Application</option>
            <option value="UI">UI</option>
            <option value="AGENT">Agent</option>
            <option value="GAME">Game</option>
          </select>
        </div>
      </div>
      
      <div class="message-list">
        <div 
          class="message-item" 
          *ngFor="let message of displayMessages; trackBy: trackMessage"
          [class]="'message-' + getMessageChannel(message)"
        >
          <div class="message-header-item">
            <span class="message-type">{{ message.type }}</span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-content">
            <pre *ngIf="showRawData">{{ message.data | json }}</pre>
            <div *ngIf="!showRawData" [innerHTML]="formatMessageContent(message)"></div>
          </div>
        </div>
        
        <div class="no-messages" *ngIf="displayMessages.length === 0">
          No messages to display
        </div>
      </div>
    </div>
  `,
  styles: [`
    .aleph-message-display {
      display: flex;
      flex-direction: column;
      height: 100%;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      background: white;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .message-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .channel-filter select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
    }

    .message-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      max-height: 400px;
    }

    .message-item {
      margin-bottom: 12px;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid #ddd;
      background: #fafafa;
    }

    .message-SYSTEM {
      border-left-color: #2196f3;
      background: #e3f2fd;
    }

    .message-AGENT {
      border-left-color: #9c27b0;
      background: #f3e5f5;
    }

    .message-GAME {
      border-left-color: #4caf50;
      background: #e8f5e8;
    }

    .message-UI {
      border-left-color: #ff9800;
      background: #fff3e0;
    }

    .message-APPLICATION {
      border-left-color: #607d8b;
      background: #eceff1;
    }

    .message-header-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .message-type {
      font-weight: 500;
      color: #333;
      text-transform: uppercase;
      font-size: 12px;
    }

    .message-time {
      font-size: 11px;
      color: #666;
    }

    .message-content {
      font-size: 14px;
      line-height: 1.4;
    }

    .message-content pre {
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      overflow-x: auto;
      margin: 0;
    }

    .no-messages {
      text-align: center;
      color: #666;
      font-style: italic;
      padding: 32px;
    }
  `]
})
export class AlephMessageDisplayComponent implements OnInit, OnDestroy {
  @Input() title = 'AlephScript Messages';
  @Input() showHeader = true;
  @Input() showChannelFilter = true;
  @Input() showRawData = false;
  @Input() maxMessages = 50;
  @Input() channel: MessageChannel | 'all' = 'all';

  displayMessages: AlephMessage[] = [];
  selectedChannel: MessageChannel | 'all' = 'all';
  
  private destroy$ = new Subject<void>();
  private allMessages: AlephMessage[] = [];

  constructor(private alephService: AlephScriptService) {}

  ngOnInit(): void {
    this.selectedChannel = this.channel;
    this.subscribeToMessages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToMessages(): void {
    // Subscribe to all messages
    this.alephService.messages.pipe(
      takeUntil(this.destroy$)
    ).subscribe((message: AlephMessage) => {
      this.allMessages.unshift(message);
      
      // Keep only recent messages
      if (this.allMessages.length > this.maxMessages) {
        this.allMessages = this.allMessages.slice(0, this.maxMessages);
      }
      
      this.updateDisplayMessages();
    });
  }

  onChannelChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedChannel = selectElement.value as MessageChannel | 'all';
    this.updateDisplayMessages();
  }

  private updateDisplayMessages(): void {
    if (this.selectedChannel === 'all') {
      this.displayMessages = [...this.allMessages];
    } else {
      this.displayMessages = this.allMessages.filter(message => 
        this.getMessageChannel(message) === this.selectedChannel
      );
    }
  }

  getMessageChannel(message: AlephMessage): MessageChannel {
    // Simple channel detection based on message type
    const type = message.type;
    
    if (['system_message', 'GET_LIST_OF_THREADS', 'SET_DOMAIN_BASE_DATA', 'GET_ENGINE'].includes(type)) {
      return MessageChannel.SYSTEM;
    }
    
    if (['agent_message', 'agent_postulations', 'agent_selection_result'].includes(type)) {
      return MessageChannel.AGENT;
    }
    
    if (['game_action', 'game_state_update', 'phase_change'].includes(type)) {
      return MessageChannel.GAME;
    }
    
    if (['ui_message', 'notification', 'error_message'].includes(type)) {
      return MessageChannel.UI;
    }
    
    return MessageChannel.APPLICATION;
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  formatMessageContent(message: AlephMessage): string {
    if (typeof message.data === 'string') {
      return message.data;
    }
    
    if (message.data?.message) {
      return message.data.message;
    }
    
    if (message.data?.input) {
      return message.data.input;
    }
    
    return JSON.stringify(message.data, null, 2);
  }

  trackMessage(index: number, message: AlephMessage): string {
    return message.id;
  }
}
