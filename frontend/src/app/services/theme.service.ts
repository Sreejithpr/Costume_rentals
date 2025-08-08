import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = new BehaviorSubject<Theme>(this.getStoredTheme());
  
  constructor() {
    this.applyTheme(this.currentTheme.value);
  }

  get theme$() {
    return this.currentTheme.asObservable();
  }

  get currentThemeValue(): Theme {
    return this.currentTheme.value;
  }

  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme: Theme): void {
    this.currentTheme.next(theme);
    this.applyTheme(theme);
    this.storeTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private getStoredTheme(): Theme {
    const stored = localStorage.getItem('theme') as Theme;
    
    if (stored && ['light', 'dark'].includes(stored)) {
      return stored;
    }

    // Default to user's system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  private storeTheme(theme: Theme): void {
    localStorage.setItem('theme', theme);
  }

  isDarkMode(): boolean {
    return this.currentTheme.value === 'dark';
  }
}