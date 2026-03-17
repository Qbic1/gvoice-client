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
    <div class="lobby-container">
      <header class="lobby-header">
        <h1>VoiceRoom Lobby</h1>
        <div class="admin-actions">
          <button *ngIf="!adminService.isAdmin()" (click)="showAdminLogin.set(true)" class="secondary-btn">Admin Login</button>
          <button *ngIf="adminService.isAdmin()" (click)="showCreateRoom.set(true)" class="primary-btn">Create Room</button>
          <button *ngIf="adminService.isAdmin()" (click)="adminService.logout()" class="text-btn">Logout</button>
        </div>
      </header>

      <section class="room-list">
        <h2>Active Rooms</h2>
        <div *ngIf="rooms().length === 0" class="empty-state">
          No active rooms. {{ adminService.isAdmin() ? 'Create one to get started!' : 'Wait for an admin to create a room.' }}
        </div>
        <div class="grid">
          <div *ngFor="let room of rooms()" class="room-card" [routerLink]="['/room', room.id]">
            <div class="room-info">
              <h3>{{ room.name }}</h3>
              <p>{{ room.participantCount }} / 10 participants</p>
            </div>
            <div class="join-arrow">→</div>
          </div>
        </div>
      </section>

      <!-- Admin Login Modal -->
      <div *ngIf="showAdminLogin()" class="modal-overlay">
        <div class="modal">
          <h3>Admin Authentication</h3>
          <input type="password" [(ngModel)]="adminPasswordInput" placeholder="Enter Global Admin Password" />
          <div class="modal-actions">
            <button (click)="showAdminLogin.set(false)">Cancel</button>
            <button (click)="loginAdmin()" class="primary-btn">Verify</button>
          </div>
        </div>
      </div>

      <!-- Create Room Modal -->
      <div *ngIf="showCreateRoom()" class="modal-overlay">
        <div class="modal">
          <h3>Create New Room</h3>
          <input type="text" [(ngModel)]="newRoomName" placeholder="Room Name (e.g. Daily Sync)" />
          <input type="password" [(ngModel)]="newRoomPassword" placeholder="Room Password (required to join)" />
          <div class="modal-actions">
            <button (click)="showCreateRoom.set(false)">Cancel</button>
            <button (click)="createRoom()" class="primary-btn" [disabled]="!newRoomName || !newRoomPassword">Create</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lobby-container { 
      max-width: 900px; 
      margin: 4rem auto; 
      padding: 0 2rem; 
      font-family: var(--font-family); 
    }
    .lobby-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 3rem; 
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--gray-200);
    }
    .lobby-header h1 { 
      font-size: 2.25rem; 
      font-weight: 800; 
      letter-spacing: -0.05em; 
      color: var(--gray-900);
    }
    .admin-actions { 
      display: flex; 
      gap: 1rem; 
      align-items: center; 
    }
    
    .room-list h2 { 
      margin-bottom: 1.5rem; 
      font-size: 1rem; 
      color: var(--gray-500); 
      text-transform: uppercase; 
      letter-spacing: 0.05em; 
      font-weight: 600;
    }
    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
      gap: 1.5rem; 
    }
    
    .room-card { 
      background: #fff; 
      border: 1px solid var(--gray-200); 
      padding: 1.5rem; 
      border-radius: var(--border-radius); 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      cursor: pointer; 
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }
    .room-card:hover { 
      border-color: var(--primary-400); 
      transform: translateY(-3px); 
      box-shadow: var(--shadow-lg); 
    }
    .room-card h3 { 
      margin: 0 0 0.25rem 0; 
      font-size: 1.125rem; 
      font-weight: 600;
      color: var(--gray-800);
    }
    .room-card p { 
      margin: 0; 
      color: var(--gray-500); 
      font-size: 0.875rem; 
    }
    .join-arrow { 
      font-size: 1.5rem; 
      color: var(--gray-300); 
      transition: all 0.2s ease;
    }
    .room-card:hover .join-arrow { 
      color: var(--primary-500); 
      transform: translateX(4px);
    }

    .primary-btn { 
      background: var(--primary-600); 
      color: #fff; border: none; 
      padding: 0.75rem 1.5rem; 
      border-radius: 0.5rem; 
      cursor: pointer; 
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }
    .primary-btn:hover { background: var(--primary-700); box-shadow: var(--shadow-md); transform: translateY(-1px); }
    .primary-btn:disabled { background: var(--gray-300); cursor: not-allowed; }

    .secondary-btn { 
      background: #fff; 
      color: var(--gray-800);
      border: 1px solid var(--gray-300); 
      padding: 0.75rem 1.5rem; 
      border-radius: 0.5rem; 
      cursor: pointer; 
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .secondary-btn:hover { border-color: var(--gray-400); background: var(--gray-50); }

    .text-btn { 
      background: none; 
      border: none; 
      color: var(--error-500); 
      cursor: pointer; 
      font-weight: 600; 
    }
    
    .empty-state { 
      padding: 4rem; 
      text-align: center; 
      background: var(--gray-100); 
      border: 2px dashed var(--gray-300); 
      border-radius: var(--border-radius); 
      color: var(--gray-500); 
    }

    .modal-overlay { 
      position: fixed; 
      top:0; left:0; right:0; bottom:0; 
      background: rgba(0,0,0,0.6); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      z-index: 100;
      backdrop-filter: blur(4px);
    }
    .modal { 
      background: #fff; 
      padding: 2.5rem; 
      border-radius: var(--border-radius); 
      width: 100%; 
      max-width: 400px; 
      box-shadow: var(--shadow-lg);
    }
    .modal h3 { 
      margin-top: 0; 
      margin-bottom: 1.5rem; 
      color: var(--gray-900);
      font-size: 1.25rem;
    }
    .modal input { 
      width: 100%; 
      padding: 0.75rem 1rem; 
      border: 1px solid var(--gray-300); 
      border-radius: 0.5rem; 
      margin-bottom: 1rem; 
      box-sizing: border-box; 
      font-size: 1rem;
    }
    .modal input:focus {
      outline: 2px solid var(--primary-400);
      border-color: transparent;
    }
    .modal-actions { 
      display: flex; 
      justify-content: flex-end; 
      gap: 1rem; 
      margin-top: 1.5rem; 
    }
    .modal-actions button { 
      background: none; 
      border: none; 
      cursor: pointer; 
      font-weight: 600;
      padding: 0.6rem 1.2rem;
      border-radius: 0.5rem;
      transition: all 0.2s ease;
    }
    .modal-actions button:first-child {
      color: var(--gray-700);
    }
    .modal-actions button:first-child:hover {
      background: var(--gray-100);
    }
    .modal-actions .primary-btn { 
      background: var(--primary-600); 
      color: #fff; 
    }
    .modal-actions .primary-btn:hover { background: var(--primary-700); }
  `]
})
export class LobbyComponent implements OnInit {
  private signalrService = inject(SignalRService);
  public adminService = inject(AdminService);
  private router = inject(Router);

  rooms = signal<RoomInfo[]>([]);
  showAdminLogin = signal(false);
  showCreateRoom = signal(false);

  adminPasswordInput = '';
  newRoomName = '';
  newRoomPassword = '';

  async ngOnInit() {
    this.rooms.set(await this.signalrService.fetchRooms());
    
    // Connect to SignalR to receive real-time room updates.
    // The connection here is for general lobby events, not a specific room.
    await this.signalrService.startConnection('lobby');
    this.signalrService.roomCreated$.subscribe(async () => {
      this.rooms.set(await this.signalrService.fetchRooms());
    });
  }

  async loginAdmin() {
    if (await this.adminService.verifyAdmin(this.adminPasswordInput)) {
      this.showAdminLogin.set(false);
      this.adminPasswordInput = '';
    } else {
      alert('Invalid Admin Password');
    }
  }

  async createRoom() {
    const adminPassword = this.adminService.getAdminPassword();
    if (!adminPassword) {
      alert('Session expired or admin password missing. Please login again.');
      this.adminService.logout();
      this.showAdminLogin.set(true);
      return;
    }

    await this.signalrService.createRoom(adminPassword, this.newRoomName, this.newRoomPassword);
    this.showCreateRoom.set(false);
    this.newRoomName = '';
    this.newRoomPassword = '';
  }
}
