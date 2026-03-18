import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  private readonly ADMIN_KEY = 'gv_is_admin';
  private readonly PWD_KEY = 'gv_admin_pwd';
  
  isAdmin = signal<boolean>(false);
  private currentPassword: string | null = null;

  constructor() {
    if (this.isBrowser) {
      this.isAdmin.set(localStorage.getItem(this.ADMIN_KEY) === 'true');
      this.currentPassword = localStorage.getItem(this.PWD_KEY);
    }
  }

  async verifyAdmin(password: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${environment.rootUrl}/admin/verify`, { password }));
      this.isAdmin.set(true);
      this.currentPassword = password;
      
      if (this.isBrowser) {
        localStorage.setItem(this.ADMIN_KEY, 'true');
        localStorage.setItem(this.PWD_KEY, password);
      }
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
    // We keep currentPassword and PWD_KEY in localStorage as requested
    if (this.isBrowser) {
      localStorage.removeItem(this.ADMIN_KEY);
    }
  }
}
