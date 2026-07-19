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
      // Never trust the client-side flag (anyone can set gv_is_admin=true in
      // DevTools). Re-verify the remembered password against the server; only
      // then grant the admin UI. Clear any stale flag if there's no password
      // or verification fails.
      const storedPassword = sessionStorage.getItem(this.PWD_KEY);
      if (storedPassword) {
        this.verifyAdmin(storedPassword).then(ok => {
          if (!ok) this.logout();
        });
      } else {
        this.logout();
      }
    }
  }

  async verifyAdmin(password: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${environment.rootUrl}/admin/verify`, { password }));
      this.isAdmin.set(true);
      this.currentPassword = password;
      
      if (this.isBrowser) {
        localStorage.setItem(this.ADMIN_KEY, 'true');
        sessionStorage.setItem(this.PWD_KEY, password);
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
    this.currentPassword = null;
    if (this.isBrowser) {
      localStorage.removeItem(this.ADMIN_KEY);
      sessionStorage.removeItem(this.PWD_KEY);
    }
  }
}
