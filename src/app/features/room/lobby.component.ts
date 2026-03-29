import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SignalRService, RoomInfo } from '../../core/services/signalr.service';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="lobby-page">

      <div class="bg-orb bg-orb-1"></div>
      <div class="bg-orb bg-orb-2"></div>

      <div class="lobby-container">

        <!-- Header -->
        <header class="lobby-header">
          <div class="brand">
            <span class="brand-logo">V</span>
            <div class="brand-text">
              <span class="brand-name">VoiceRoom</span>
              <span class="brand-tag">Lobby</span>
            </div>
          </div>

          <div class="header-right">
            <div class="rooms-badge" *ngIf="rooms().length > 0">
              <span class="rooms-dot"></span>
              <span class="rooms-count">{{ rooms().length }}</span>
              <span class="rooms-label"> rooms active</span>
            </div>
            <button *ngIf="!adminService.isAdmin()" (click)="openAdminLogin()" class="secondary-btn">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span class="btn-label">Admin</span>
            </button>
            <button *ngIf="adminService.isAdmin()" (click)="showCreateRoom.set(true)" class="primary-btn">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span class="btn-label">Create Room</span>
            </button>
            <button *ngIf="adminService.isAdmin()" (click)="adminService.logout()" class="text-btn">Logout</button>
          </div>
        </header>

        <!-- Room list -->
        <section class="room-section">
          <div class="section-header">
            <h2>Active Rooms</h2>
            <span class="section-hint" *ngIf="rooms().length > 0">Tap to join</span>
          </div>

          <div *ngIf="rooms().length === 0" class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p class="empty-title">No active rooms</p>
            <p class="empty-sub">
              {{ adminService.isAdmin() ? 'Create the first room to get started.' : 'Check back soon or ask an admin to create a room.' }}
            </p>
            <button *ngIf="adminService.isAdmin()" (click)="showCreateRoom.set(true)" class="primary-btn empty-cta">
              Create First Room
            </button>
          </div>

          <div class="grid" *ngIf="rooms().length > 0">
            <div *ngFor="let room of rooms()" 
                 class="room-card" 
                 [class.active-card]="activeRoomId() === room.id"
                 [routerLink]="['/room', room.id]">
              <div class="room-avatar" [style.background]="getRoomColor(room.name)">
                {{ room.name.charAt(0).toUpperCase() }}
              </div>
              <div class="room-info">
                <h3>{{ room.name }}</h3>
                <div class="room-meta">
                  <div class="capacity-bar">
                    <div
                      class="capacity-fill"
                      [style.width.%]="(room.participantCount / 10) * 100"
                      [class.capacity-full]="room.participantCount >= 10"
                    ></div>
                  </div>
                  <span class="capacity-text" [class.capacity-full-text]="room.participantCount >= 10">
                    {{ room.participantCount }}/10
                  </span>
                </div>
              </div>

              <div class="room-actions">
                <button class="info-btn" 
                        (click)="toggleParticipants($event, room.id)"
                        [class.active]="activeRoomId() === room.id">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </button>

                <div class="join-btn" [class.full]="room.participantCount >= 10">
                  <span *ngIf="room.participantCount < 10">Join</span>
                  <span *ngIf="room.participantCount >= 10">Full</span>
                  <svg *ngIf="room.participantCount < 10" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              </div>

              <!-- Participant Popover -->
              <div class="participants-popover" *ngIf="activeRoomId() === room.id">
                <div class="popover-header">
                  <span>Participants</span>
                  <span class="popover-count">{{ activeParticipants().length }}</span>
                </div>
                <div class="popover-list" *ngIf="activeParticipants().length > 0">
                  <div *ngFor="let name of activeParticipants()" class="participant-item">
                    <div class="status-dot"></div>
                    <span class="participant-name">{{ name }}</span>
                  </div>
                </div>
                <div class="popover-empty" *ngIf="activeParticipants().length === 0">
                  No one here yet
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <!-- Admin Login Modal -->
      <div *ngIf="showAdminLogin()" class="modal-overlay" (click)="closeModals()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3>Admin Login</h3>
          <p class="modal-sub">Enter your admin password to manage rooms.</p>
          <div *ngIf="errorMessage()" class="error-banner">{{ errorMessage() }}</div>
          <div class="input-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="adminPasswordInput" placeholder="Enter admin password" (keyup.enter)="loginAdmin()" autofocus />
          </div>
          <div class="modal-actions">
            <button class="ghost-btn" (click)="closeModals()">Cancel</button>
            <button class="primary-btn" (click)="loginAdmin()">Verify</button>
          </div>
        </div>
      </div>

      <!-- Create Room Modal -->
      <div *ngIf="showCreateRoom()" class="modal-overlay" (click)="closeModals()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <h3>Create Room</h3>
          <p class="modal-sub">Set up a new voice room for your team.</p>
          <div *ngIf="errorMessage()" class="error-banner">{{ errorMessage() }}</div>
          <div class="input-group">
            <label>Room Name</label>
            <input type="text" [(ngModel)]="newRoomName" placeholder="e.g. Daily Sync" />
          </div>
          <div class="input-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="newRoomPassword" placeholder="Required to join" />
          </div>
          <div class="modal-actions">
            <button class="ghost-btn" (click)="closeModals()">Cancel</button>
            <button class="primary-btn" (click)="createRoom()" [disabled]="!newRoomName.trim() || !newRoomPassword.trim()">
              Create Room
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .lobby-page {
      min-height: 100dvh;
      background: var(--bg-base);
      position: relative;
      overflow: hidden;
    }
    .bg-orb {
      position: fixed;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
    }
    .bg-orb-1 {
      width: 500px; height: 500px;
      background: var(--accent);
      top: -200px; right: -100px;
      opacity: 0.1;
    }
    .bg-orb-2 {
      width: 400px; height: 400px;
      background: var(--accent-hover);
      bottom: -150px; left: -100px;
      opacity: 0.07;
    }

    .lobby-container {
      position: relative;
      z-index: 1;
      max-width: 860px;
      margin: 0 auto;
      padding: 0 1rem 4rem;
    }
    @media (min-width: 600px) {
      .lobby-container { padding: 0 2rem 4rem; }
    }

    /* ── Header ── */
    .lobby-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.125rem 0 1.25rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.5rem;
      gap: 0.5rem;
    }
    @media (min-width: 600px) {
      .lobby-header { padding: 1.5rem 0 2rem; margin-bottom: 2rem; }
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-shrink: 0;
      min-width: 0;
    }
    .brand-logo {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: var(--accent);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.9375rem;
      flex-shrink: 0;
      box-shadow: 0 3px 10px color-mix(in srgb, var(--accent) 35%, transparent);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
      min-width: 0;
    }
    .brand-name {
      font-size: 0.9375rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.03em;
      white-space: nowrap;
    }
    .brand-tag {
      font-size: 0.6rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    @media (min-width: 600px) {
      .brand-logo { width: 38px; height: 38px; font-size: 1rem; }
      .brand-name  { font-size: 1.0625rem; }
      .brand-tag   { font-size: 0.65rem; }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    /* Rooms badge */
    .rooms-badge {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--success-500);
      background: color-mix(in srgb, var(--success-500) 12%, var(--bg-surface));
      border: 1px solid color-mix(in srgb, var(--success-500) 25%, transparent);
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      white-space: nowrap;
    }
    .rooms-dot {
      width: 5px; height: 5px; min-width: 5px;
      border-radius: 50%;
      background: var(--success-500);
      display: block;
      animation: blink 2s infinite;
    }
    @media (max-width: 360px) {
      .rooms-label { display: none; }
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* ── Buttons ── */
    .primary-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8125rem;
      white-space: nowrap;
      transition: all 0.2s;
      box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent);
    }
    .primary-btn:hover:not(:disabled) {
      background: var(--accent-hover);
      transform: translateY(-1px);
    }
    .primary-btn:disabled {
      background: var(--bg-muted);
      color: var(--text-muted);
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
    .secondary-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--border);
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8125rem;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .secondary-btn:hover {
      border-color: var(--accent);
      background: var(--accent-subtle);
      color: var(--accent);
    }
    /* Icon-only on very small screens */
    @media (max-width: 380px) {
      .btn-label { display: none; }
      .primary-btn, .secondary-btn { padding: 0.5rem 0.625rem; }
    }
    .ghost-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    .ghost-btn:hover { background: var(--bg-muted); color: var(--text-primary); }
    .text-btn {
      background: none;
      border: none;
      color: var(--error-500);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8125rem;
      padding: 0.5rem 0.375rem;
      white-space: nowrap;
      transition: opacity 0.2s;
    }
    .text-btn:hover { opacity: 0.7; }

    /* ── Section header ── */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.875rem;
    }
    .section-header h2 {
      margin: 0;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .section-hint { font-size: 0.7rem; color: var(--text-muted); }

    /* ── Grid: single column on mobile, auto-grid on wider ── */
    .grid {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }
    @media (min-width: 580px) {
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 1rem;
      }
    }

    /* ── Room card ── */
    .room-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.875rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
      text-decoration: none;
      -webkit-tap-highlight-color: transparent;
      position: relative;
    }
    .room-card:hover, .room-card:active {
      border-color: var(--accent);
      box-shadow: var(--shadow-md);
    }
    .room-card:hover .join-btn, .room-card:active .join-btn {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }
    @media (min-width: 600px) {
      .room-card { border-radius: 14px; padding: 1.125rem 1.25rem; gap: 1rem; }
      .room-card:hover { transform: translateY(-2px); }
    }
    .room-card.active-card {
      z-index: 20;
      border-color: var(--accent);
    }

    .room-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .info-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1.5px solid var(--border);
      background: var(--bg-base);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .info-btn:hover, .info-btn.active {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-subtle);
    }

    .room-avatar {
      width: 38px; height: 38px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9375rem;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
    }
    @media (min-width: 600px) {
      .room-avatar { width: 42px; height: 42px; font-size: 1rem; border-radius: 10px; }
    }
    .room-info { flex: 1; min-width: 0; }
    .room-info h3 {
      margin: 0 0 0.375rem;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    @media (min-width: 600px) {
      .room-info h3 { font-size: 0.9375rem; margin-bottom: 0.425rem; }
    }
    .room-meta { display: flex; align-items: center; gap: 0.5rem; }
    .capacity-bar {
      flex: 1;
      height: 3px;
      background: var(--bg-muted);
      border-radius: 9999px;
      overflow: hidden;
    }
    .capacity-fill {
      height: 100%;
      background: var(--accent);
      border-radius: 9999px;
      transition: width 0.3s ease;
    }
    .capacity-fill.capacity-full { background: var(--error-500); }
    .capacity-text {
      font-size: 0.63rem;
      font-weight: 700;
      color: var(--text-muted);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .capacity-full-text { color: var(--error-500); }
    .join-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      border: 1.5px solid var(--border);
      color: var(--text-secondary);
      background: var(--bg-base);
      transition: all 0.2s;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .join-btn.full {
      border-color: color-mix(in srgb, var(--error-500) 30%, transparent);
      color: var(--error-500);
      background: color-mix(in srgb, var(--error-500) 8%, var(--bg-surface));
    }

    /* ── Participants Popover ── */
    .participants-popover {
      position: absolute;
      left: calc(100% + 12px);
      top: 50%;
      transform: translateY(-50%);
      width: 180px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.75rem;
      box-shadow: var(--shadow-lg);
      z-index: 10;
      animation: popIn 0.2s ease-out;
    }
    .participants-popover::after {
      content: '';
      position: absolute;
      right: 100%;
      top: 50%;
      margin-top: -6px;
      border-width: 6px;
      border-style: solid;
      border-color: transparent var(--border) transparent transparent;
    }
    @media (max-width: 800px) {
      /* On smaller screens where space is tight, show below or handle differently */
      .participants-popover {
        left: auto;
        right: 0;
        top: calc(100% + 8px);
        transform: none;
        width: 100%;
      }
      .participants-popover::after { display: none; }
    }

    .popover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.625rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .popover-header span:first-child {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .popover-count {
      background: var(--bg-muted);
      color: var(--text-secondary);
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .popover-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      max-height: 160px;
      overflow-y: auto;
    }
    .participant-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .status-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--success-500);
      flex-shrink: 0;
    }
    .participant-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .popover-empty {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-style: italic;
      text-align: center;
      padding: 0.25rem 0;
    }

    @keyframes popIn {
      from { opacity: 0; transform: translateY(-50%) scale(0.95); }
      to { opacity: 1; transform: translateY(-50%) scale(1); }
    }
    @media (max-width: 800px) {
      @keyframes popIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    }

    /* ── Empty state ── */
    .empty-state {
      padding: 2.5rem 1.5rem;
      text-align: center;
      background: var(--bg-surface);
      border: 1.5px dashed var(--border);
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .empty-icon {
      width: 52px; height: 52px;
      border-radius: 13px;
      background: var(--bg-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    .empty-title { margin: 0; font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); }
    .empty-sub {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--text-muted);
      max-width: 280px;
      line-height: 1.5;
    }
    .empty-cta { margin-top: 1rem; }

    /* ── Modal — bottom sheet on mobile, centered on desktop ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 100;
      backdrop-filter: blur(6px);
      animation: fadeIn 0.15s ease-out;
    }
    @media (min-width: 600px) {
      .modal-overlay { align-items: center; }
    }
    .modal {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      padding: 1.5rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom));
      border-radius: 20px 20px 0 0;
      width: 100%;
      box-shadow: var(--shadow-lg);
      animation: slideUp 0.22s ease-out;
    }
    /* Drag handle */
    .modal::before {
      content: '';
      display: block;
      width: 32px;
      height: 3px;
      background: var(--border);
      border-radius: 9999px;
      margin: 0 auto 1.125rem;
    }
    @media (min-width: 600px) {
      .modal {
        border-radius: 18px;
        padding: 2rem;
        max-width: 400px;
      }
      .modal::before { display: none; }
    }
    .modal-icon {
      width: 42px; height: 42px;
      border-radius: 11px;
      background: var(--accent-subtle);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.875rem;
    }
    .modal h3 {
      margin: 0 0 0.25rem;
      font-size: 1.125rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: var(--text-primary);
    }
    .modal-sub {
      margin: 0 0 1.25rem;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .error-banner {
      background: color-mix(in srgb, var(--error-500) 10%, var(--bg-surface));
      border: 1px solid color-mix(in srgb, var(--error-500) 30%, transparent);
      color: var(--error-500);
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.625rem 0.875rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin-bottom: 0.875rem;
    }
    .input-group label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }
    .input-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 1rem; /* 16px — prevents iOS auto-zoom */
      background: var(--bg-base);
      color: var(--text-primary);
      transition: all 0.2s;
      box-sizing: border-box;
      font-family: var(--font-family);
    }
    .input-group input::placeholder { color: var(--text-muted); }
    .input-group input:focus {
      outline: 2px solid var(--accent);
      border-color: transparent;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.25rem;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LobbyComponent implements OnInit {
  private signalrService = inject(SignalRService);
  public adminService = inject(AdminService);
  private router = inject(Router);

  rooms = signal<RoomInfo[]>([]);
  showAdminLogin = signal(false);
  showCreateRoom = signal(false);
  errorMessage = signal<string | null>(null);

  activeRoomId = signal<string | null>(null);
  activeParticipants = signal<string[]>([])

  adminPasswordInput = '';
  newRoomName = '';
  newRoomPassword = '';

  async ngOnInit() {
    this.rooms.set(await this.signalrService.fetchRooms());
    await this.signalrService.startConnection('lobby');
    this.signalrService.roomCreated$.subscribe(async () => {
      this.rooms.set(await this.signalrService.fetchRooms());
    });
  }

  async toggleParticipants(event: Event, roomId: string) {
    event.stopPropagation();
    event.preventDefault();
    if (this.activeRoomId() === roomId) {
      this.activeRoomId.set(null);
      this.activeParticipants.set([]);
    } else {
      this.activeRoomId.set(roomId);
      this.activeParticipants.set(await this.signalrService.fetchRoomParticipants(roomId));
    }
  }

  getRoomColor(name: string): string {
    const colors = ['#6366f1', '#ec4899', '#8b5cf6', '#0d9488', '#f59e0b', '#3b82f6', '#e11d48', '#10b981'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  openAdminLogin() {
    this.errorMessage.set(null);
    this.adminPasswordInput = this.adminService.getAdminPassword() || '';
    this.showAdminLogin.set(true);
  }

  closeModals() {
    this.showAdminLogin.set(false);
    this.showCreateRoom.set(false);
    this.errorMessage.set(null);
  }

  async loginAdmin() {
    this.errorMessage.set(null);
    if (await this.adminService.verifyAdmin(this.adminPasswordInput)) {
      this.showAdminLogin.set(false);
      this.adminPasswordInput = '';
    } else {
      this.errorMessage.set('Incorrect password. Please try again.');
    }
  }

  async createRoom() {
    this.errorMessage.set(null);
    const adminPassword = this.adminService.getAdminPassword();
    if (!adminPassword) {
      this.errorMessage.set('Session expired. Please login again.');
      this.adminService.logout();
      this.showAdminLogin.set(true);
      return;
    }
    try {
      await this.signalrService.createRoom(adminPassword, this.newRoomName, this.newRoomPassword);
      this.showCreateRoom.set(false);
      this.newRoomName = '';
      this.newRoomPassword = '';
    } catch (err) {
      this.errorMessage.set('Failed to create room. Please try again.');
    }
  }
}