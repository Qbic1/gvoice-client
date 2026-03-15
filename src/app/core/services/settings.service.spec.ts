import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsService } from './settings.service';
import { signal } from '@angular/core';

// Mock isPlatformBrowser
vi.mock('@angular/common', () => ({
  isPlatformBrowser: () => true
}));

describe('SettingsService', () => {
  let service: SettingsService;
  let storage: { [key: string]: string };

  beforeEach(() => {
    storage = {};
    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
    });

    // Manually instantiate the service
    service = new SettingsService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize pttKey with the default value if nothing is in localStorage', () => {
    expect(service.pttKey()).toBe('Space');
  });

  it('should initialize pttKey from localStorage if a value exists', () => {
    localStorage.setItem('gvoice_ptt_key', 'KeyB');
    const newService = new SettingsService();
    expect(newService.pttKey()).toBe('KeyB');
  });

  it('should save the PTT key to the signal and localStorage', () => {
    const newKey = 'ControlLeft';
    service.savePttKey(newKey);
    
    expect(service.pttKey()).toBe(newKey);
    expect(localStorage.setItem).toHaveBeenCalledWith('gvoice_ptt_key', newKey);
    expect(localStorage.getItem('gvoice_ptt_key')).toBe(newKey);
  });

  it('should reset the PTT key to its default value', () => {
    // Set a custom key first
    service.savePttKey('AltLeft');
    expect(service.pttKey()).toBe('AltLeft');

    // Reset to default
    service.resetToDefault();
    
    expect(service.pttKey()).toBe('Space');
    expect(localStorage.setItem).toHaveBeenCalledWith('gvoice_ptt_key', 'Space');
    expect(localStorage.getItem('gvoice_ptt_key')).toBe('Space');
  });
});
