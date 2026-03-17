import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, Routes, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LobbyComponent } from './features/room/lobby.component';
import { App } from './app';

const routes: Routes = [
  { path: '', component: LobbyComponent },
  { path: 'room/:roomId', component: App },
  { path: '**', redirectTo: '' }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(), 
    provideClientHydration(withEventReplay()),
  ]
};
