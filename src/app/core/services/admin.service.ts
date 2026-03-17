import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly ADMIN_KEY = 'gv_is_admin';
  
  isAdmin = signal<boolean>(localStorage.getItem(this.ADMIN_KEY) === 'true');
  private currentPassword: string | null = null;

  async verifyAdmin(password: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${environment.rootUrl}/admin/verify`, { password }));
      this.isAdmin.set(true);
      this.currentPassword = password;
      localStorage.setItem(this.ADMIN_KEY, 'true');
      return true;
    } catch (err) {
      console.error('Admin verification failed');
      return false;
    }
  }

  getAdminPassword(): string | null {
    return this.currentPassword;
  }

  logout() {
    this.isAdmin.set(false);
    localStorage.removeItem(this.ADMIN_KEY);
  }
}
