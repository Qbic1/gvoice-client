import { Directive, ElementRef, OnDestroy, AfterViewInit, inject, PLATFORM_ID, Input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Keeps keyboard focus inside a dialog for as long as it is open, and hands it
 * back where it came from on close.
 *
 * Without this, every overlay in the app was a one-way door for a keyboard
 * user: focus stayed on whatever was behind the scrim, so Tab walked through
 * the room underneath a modal that visually blocked it, and closing the modal
 * left focus nowhere in particular.
 *
 * Applied together with `role="dialog"` and `aria-modal="true"`; this directive
 * owns the focus behavior only.
 */
@Directive({
  selector: '[appFocusTrap]',
  standalone: true,
})
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  /** Element to restore focus to on destroy. Defaults to whatever had it. */
  @Input() focusTrapRestoreTo: HTMLElement | null = null;

  /**
   * Off for a host that is not actually a dialog — the settings panel renders
   * inline as the mobile Settings tab, where stealing focus would be wrong.
   */
  @Input() focusTrapDisabled = false;

  private previouslyFocused: HTMLElement | null = null;
  private focusTimer: ReturnType<typeof setTimeout> | null = null;

  private static readonly FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  ngAfterViewInit(): void {
    if (!this.isBrowser || this.focusTrapDisabled) return;

    const host = this.host.nativeElement;
    if (!host.hasAttribute('tabindex')) host.setAttribute('tabindex', '-1');

    const active = document.activeElement;
    this.previouslyFocused = this.focusTrapRestoreTo ?? (active instanceof HTMLElement ? active : null);

    this.host.nativeElement.addEventListener('keydown', this.onKeydown, true);

    // A timer, not requestAnimationFrame: rAF never fires while the tab is not
    // compositing (backgrounded, or a hidden window), which would leave the
    // dialog open with focus still behind it. A macrotask runs regardless and
    // is late enough for the dialog's content to exist.
    this.focusTimer = setTimeout(() => {
      const first = this.focusable()[0];
      (first ?? this.host.nativeElement).focus?.();
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser || this.focusTrapDisabled) return;
    if (this.focusTimer !== null) clearTimeout(this.focusTimer);
    this.host.nativeElement.removeEventListener('keydown', this.onKeydown, true);
    // Only restore if focus is still inside (or has been lost to the body);
    // if the user has already clicked elsewhere, leave them alone.
    const active = document.activeElement;
    const shouldRestore =
      !active || active === document.body || this.host.nativeElement.contains(active);
    if (shouldRestore && this.previouslyFocused?.isConnected) {
      this.previouslyFocused.focus();
    }
  }

  private focusable(): HTMLElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(FocusTrapDirective.FOCUSABLE)
    ).filter(el => el.offsetParent !== null || el === document.activeElement);
  }

  private onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;
    const items = this.focusable();
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !this.host.nativeElement.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };
}
