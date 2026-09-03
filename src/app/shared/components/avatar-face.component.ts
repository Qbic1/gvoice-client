import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AvatarId, FEATURE_INK, MUTED_INK, MUTED_SKIN, PORTRAIT_PAINT, avatarDef } from '../avatars';

let uid = 0;

/**
 * A participant's avatar, drawn as an inline SVG portrait.
 *
 * The drawing is a portrait in a frame, not a glyph on a disc: a deep ink
 * background, a large egg-shaped head cropped by the frame, shoulders at the
 * bottom, and near-black features. What identifies an avatar is its **prop** —
 * the hat, the mustache, the eyepatch — because at the 44px it renders on a
 * card, a silhouette survives and an expression does not. Three of these were
 * redrawn for exactly that reason: a spiral eye, a tongue that matched the skin
 * it sat on, and an eyepatch whose strap ran straight through the other eye.
 *
 * Every state is carried by static shape and color. The mouth animation and the
 * blink are amplifiers only, and both are switched off by the app's background
 * tab class and by `prefers-reduced-motion` — the roster has to stay readable
 * with all motion dead.
 */
@Component({
  selector: 'app-avatar-face',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 44 44"
     class="avatar-face"
     [class.talking]="talking()"
     [class.blinks]="blink()"
     [style.--blink-delay]="blinkDelay()"
     [attr.role]="decorative() ? null : 'img'"
     [attr.aria-hidden]="decorative() ? 'true' : null"
     [attr.aria-label]="decorative() ? null : def().name">
  <defs>
    <clipPath [attr.id]="clipId"><rect width="44" height="44" rx="9"/></clipPath>
  </defs>
  <g [attr.clip-path]="'url(#' + clipId + ')'">
    <rect width="44" height="44" [attr.fill]="ink()"/>

    <!-- shoulders and collar, cropped by the frame -->
    <ellipse cx="22" cy="41.6" rx="17" ry="8.4" [attr.fill]="PAINT.linen"/>
    <path d="M18 37h8l-4 5z" [attr.fill]="K" opacity=".22"/>

    <ellipse cx="22" cy="25.4" rx="14.6" ry="15.2" [attr.fill]="skin()"/>
    <ellipse cx="22" cy="23" rx="13" ry="12.6" [attr.fill]="skin()"/>
    <ellipse cx="13.2" cy="29.8" rx="2.8" ry="1.8" [attr.fill]="K" opacity=".1"/>
    <ellipse cx="30.8" cy="29.8" rx="2.8" ry="1.8" [attr.fill]="K" opacity=".1"/>

    @if (muted()) {
      <!-- Mouth sewn shut, palette drained. The hat still renders below: strip a
           muted participant of their prop and nobody can tell who they are. -->
      <g class="eyes" [attr.stroke]="K" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M14.4 24.6q2.4-2.8 4.8 0M24.8 24.6q2.4-2.8 4.8 0"/>
      </g>
      <path d="M16.4 31h11.2" [attr.stroke]="K" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M18.4 28.8l-1.6 4.2M22 28.8l-1.6 4.2M25.6 28.8l-1.6 4.2"
            [attr.stroke]="K" stroke-width="1.2" stroke-linecap="round" opacity=".85"/>
    } @else if (deafened()) {
      <g [attr.stroke]="K" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M14.4 25.4q2.4 2.6 4.8 0M24.8 25.4q2.4 2.6 4.8 0"/>
        <path d="M17.6 31.6q4.4 2 8.8 0"/>
      </g>
    } @else {
      @switch (id()) {
        @case ('cheerful') {
          <g class="eyes" [attr.stroke]="K" stroke-width="2" fill="none" stroke-linecap="round">
            <path d="M14.4 24.6q2.4-2.8 4.8 0M24.8 24.6q2.4-2.8 4.8 0"/>
          </g>
          <path class="mo" d="M16 29.4a6.4 6.4 0 0 0 12 0z" [attr.fill]="K"/>
          <circle cx="13.6" cy="27.6" r=".7" [attr.fill]="K" opacity=".45"/>
          <circle cx="30.4" cy="27.6" r=".7" [attr.fill]="K" opacity=".45"/>
        }
        @case ('playful') {
          <!-- Tongue is outlined and wider than tall: unoutlined pink on pink
               skin read as a smudge, not a tongue. Sits left, opposite the wink. -->
          <g class="eyes">
            <circle cx="16.8" cy="24.6" r="1.9" [attr.fill]="K"/>
            <path d="M24.9 25q2.5-2.6 5 0" [attr.stroke]="K" stroke-width="2" fill="none" stroke-linecap="round"/>
          </g>
          <path class="mo" d="M16.4 29.4q5.6 4.8 11.2 0z" [attr.fill]="K"/>
          <path d="M17.6 30h4.5q.7 0 .6 1.3l-.2 1.6q-.3 1.9-2.3 1.9t-2.2-1.9l-.2-1.6q-.1-1.3.6-1.3z"
                [attr.fill]="PAINT.tongue" [attr.stroke]="K" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M20.2 31.3v1.9" [attr.stroke]="PAINT.tongueCrease" stroke-width=".9" stroke-linecap="round"/>
        }
        @case ('pompous') {
          <g class="eyes">
            <circle cx="16.8" cy="25" r="1.8" [attr.fill]="K"/>
            <circle cx="27.6" cy="25" r="1.6" [attr.fill]="K"/>
          </g>
          <circle cx="27.6" cy="25" r="4.2" fill="none" [attr.stroke]="K" stroke-width="1.3" opacity=".85"/>
          <path d="M31.6 26.4l2.8 3.2" [attr.stroke]="K" stroke-width="1.1" opacity=".7"/>
          <path class="mo" d="M18.8 32.9q3.2 1.8 6.4 0" [attr.stroke]="K" stroke-width="1.9" fill="none" stroke-linecap="round"/>
          <path [attr.d]="STACHE" [attr.stroke]="K" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <path [attr.d]="STACHE_TIPS" [attr.stroke]="K" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        }
        @case ('sly') {
          <!-- The strap runs from the patch up across the forehead. Drawn as one
               edge-to-edge line it passed straight through the open eye. -->
          <g class="eyes"><circle cx="16.2" cy="24.4" r="1.9" [attr.fill]="K"/></g>
          <path d="M25.2 21.2 6.4 18.4M32.9 22.6 38 21.6" [attr.stroke]="K" stroke-width="1.7" stroke-linecap="round"/>
          <ellipse cx="28.7" cy="24" rx="4.4" ry="4" [attr.fill]="K"/>
          <path class="mo" d="M18.4 32.7q3.6 2 7.2 0" [attr.stroke]="K" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path [attr.d]="STACHE" [attr.stroke]="K" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <path [attr.d]="STACHE_TIPS" [attr.stroke]="K" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        }
        @case ('scared') {
          <g class="eyes">
            <circle cx="16.6" cy="25" r="3.6" fill="#fff"/><circle cx="28" cy="25" r="3.6" fill="#fff"/>
            <circle cx="16.6" cy="25.4" r="1.4" [attr.fill]="K"/><circle cx="28" cy="25.4" r="1.4" [attr.fill]="K"/>
          </g>
          <ellipse class="mo" cx="22" cy="32" rx="1.9" ry="2.4" [attr.fill]="K"/>
          <g transform="rotate(-20 31.6 31)">
            <rect x="27.4" y="29.2" width="8.4" height="3.4" rx="1.4" [attr.fill]="PAINT.linen"/>
            <path d="M30.4 29.2v3.4M32.8 29.2v3.4" [attr.stroke]="K" stroke-width=".8" opacity=".35"/>
          </g>
        }
        @case ('angry') {
          <path d="M13.4 21.8l5.4 2.6M30.6 21.8l-5.4 2.6" [attr.stroke]="K" stroke-width="2.4" stroke-linecap="round"/>
          <g class="eyes">
            <circle cx="16.8" cy="26.4" r="1.7" [attr.fill]="K"/><circle cx="27.2" cy="26.4" r="1.7" [attr.fill]="K"/>
          </g>
          <path class="mo" d="M17.4 32.4q4.6-2.4 9.2 0" [attr.stroke]="K" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        }
        @case ('sad') {
          <g class="eyes">
            <circle cx="16.8" cy="26.6" r="1.8" [attr.fill]="K"/><circle cx="27.2" cy="26.6" r="1.8" [attr.fill]="K"/>
          </g>
          <path d="M15.4 30.2q2.2 2.8 0 3.8-2.2-1 0-3.8z" [attr.fill]="PAINT.tear"/>
          <path class="mo" d="M17.6 33.4q4.4-3 8.8 0" [attr.stroke]="K" stroke-width="2.1" fill="none" stroke-linecap="round"/>
        }
        @case ('sleepy') {
          <path d="M14.4 25.6q2.6 2.6 5.2 0M24.4 25.6q2.6 2.6 5.2 0" [attr.stroke]="K" stroke-width="2" fill="none" stroke-linecap="round"/>
          <circle class="mo" cx="22" cy="31.4" r="1.9" [attr.stroke]="K" stroke-width="1.8" fill="none"/>
          <path d="M33.6 24.6h4.2l-4.2 4.2h4.2" [attr.stroke]="K" stroke-width="1.5" fill="none" stroke-linejoin="round" opacity=".75"/>
        }
        @case ('dumb') {
          <path d="M13.4 20.4h5.2M25.4 20.4h5.2" [attr.stroke]="K" stroke-width="1.8" stroke-linecap="round"/>
          <g class="eyes">
            <circle cx="16.8" cy="25" r="3.4" fill="#fff"/><circle cx="27.6" cy="25" r="3.4" fill="#fff"/>
            <circle cx="18.8" cy="25.4" r="1.4" [attr.fill]="K"/><circle cx="25.6" cy="25.4" r="1.4" [attr.fill]="K"/>
          </g>
          <ellipse class="mo" cx="22" cy="31.4" rx="4" ry="2.6" [attr.fill]="K"/>
          <path d="M22.6 32.8h3.4q.6 0 .5 1.1l-.2 1.2q-.2 1.6-1.9 1.6t-1.9-1.6l-.2-1.2q-.1-1.1.3-1.1z"
                [attr.fill]="PAINT.tongue" [attr.stroke]="K" stroke-width="1.05" stroke-linejoin="round"/>
        }
        @case ('drunk') {
          <!-- Mismatched lids, not a spiral: a 3px spiral is mush at card size. -->
          <path d="M13.4 22.2q3-2 6-.2" [attr.stroke]="K" stroke-width="1.9" fill="none" stroke-linecap="round"/>
          <circle cx="16.6" cy="24.8" r="1.8" [attr.fill]="K"/>
          <path d="M24.8 26.8q3 1.8 6 0" [attr.stroke]="K" stroke-width="2.1" fill="none" stroke-linecap="round"/>
          <ellipse cx="13.2" cy="30" rx="3.6" ry="2.2" [attr.fill]="PAINT.flush" opacity=".32"/>
          <ellipse cx="30.8" cy="30" rx="3.6" ry="2.2" [attr.fill]="PAINT.flush" opacity=".32"/>
          <path class="mo" d="M16 32.6q2.6-2.4 5.2 0t5.2 0" [attr.stroke]="K" stroke-width="2.1" fill="none" stroke-linecap="round"/>
        }
      }
    }

    @switch (id()) {
      @case ('cheerful') {
        <path d="M22 3 33 16H11z" [attr.fill]="PAINT.linen"/>
        <path d="M22 3 27 16H11z" [attr.fill]="K" opacity=".14"/>
        <circle cx="22" cy="3.2" r="2.6" [attr.fill]="PAINT.linen"/>
      }
      @case ('playful') {
        <path d="M8.6 15.5a13.4 11 0 0 1 26.8 0z" [attr.fill]="K" opacity=".92"/>
        <path d="M8.8 15.2q-5.6.6-6 3.4 4.2 1 6.6-1z" [attr.fill]="K" opacity=".7"/>
        <circle cx="22" cy="6.4" r="1.8" [attr.fill]="PAINT.linen"/>
      }
      @case ('pompous') {
        <rect x="12.5" y="1" width="19" height="12" rx="1.6" [attr.fill]="K" opacity=".9"/>
        <rect x="12.5" y="9.4" width="19" height="2.6" [attr.fill]="PAINT.linen" opacity=".55"/>
        <rect x="7" y="12.4" width="30" height="3" rx="1.5" [attr.fill]="K" opacity=".9"/>
      }
      @case ('sly') {
        <path d="M7.5 13.5q14.5-9 29 0l-1 3.4q-13.5-7.6-27 0z" [attr.fill]="K" opacity=".85"/>
      }
      @case ('scared') {
        <path d="M13 11 10 3.5M22 9.5 22 1.5M31 11l3-7.5" [attr.stroke]="K" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
      }
      @case ('angry') {
        <path d="M8 16.5a14 12.5 0 0 1 28 0z" [attr.fill]="K" opacity=".82"/>
        <rect x="5.5" y="15.2" width="33" height="3.4" rx="1.7" [attr.fill]="K" opacity=".9"/>
        <circle cx="22" cy="9.5" r="3" [attr.fill]="PAINT.linen" opacity=".85"/>
        <path d="M22 7.8v3.4M20.3 9.5h3.4" [attr.stroke]="K" stroke-width="1.2"/>
      }
      @case ('sad') {
        <path d="M8.5 19a13.5 13 0 0 1 27 0z" [attr.fill]="K" opacity=".8"/>
        <rect x="7.6" y="17.4" width="28.8" height="3.6" rx="1.8" [attr.fill]="K" opacity=".62"/>
      }
      @case ('sleepy') {
        <path d="M9 15.5q4-13 17-11.5 8 1 6 6.5-2 4.6-8 3.5" [attr.fill]="PAINT.linen"/>
        <circle cx="33" cy="12.4" r="3.1" [attr.fill]="PAINT.linen"/>
      }
      @case ('dumb') {
        <path d="M14.5 12a7.5 6.5 0 0 1 15 0z" [attr.fill]="K" opacity=".8"/>
        <rect x="12.8" y="11" width="18.4" height="2.6" rx="1.3" [attr.fill]="K" opacity=".88"/>
      }
      @case ('drunk') {
        <g transform="rotate(-14 22 14)">
          <path d="M10.5 15.6a11.5 10 0 0 1 23 0z" [attr.fill]="PAINT.linen"/>
          <rect x="6.5" y="14.6" width="31" height="3.4" rx="1.7" [attr.fill]="PAINT.linen"/>
          <path d="M10.5 15.6a11.5 10 0 0 1 23 0z" [attr.fill]="K" opacity=".1"/>
        </g>
      }
    }

    @if (deafened()) {
      <path d="M7 22a15 15 0 0 1 30 0" fill="none" [attr.stroke]="K" stroke-width="2.8" opacity=".85"/>
      <rect x="3.6" y="20.4" width="7.4" height="10" rx="3.2" [attr.fill]="K" opacity=".85"/>
      <rect x="33" y="20.4" width="7.4" height="10" rx="3.2" [attr.fill]="K" opacity=".85"/>
    }
  </g>
</svg>
`,
  styles: [`
    :host { display: inline-flex; }
    .avatar-face { display: block; border-radius: 9px; }

    /* Mouth opens while transmitting. The card's success border and ring already
       report the same thing, so this may be switched off without losing state. */
    .avatar-face.talking .mo {
      transform-origin: 22px 32px;
      animation: avatar-talk 0.18s ease-in-out infinite alternate;
    }
    @keyframes avatar-talk {
      from { transform: scaleY(0.45); }
      to   { transform: scaleY(1); }
    }

    .avatar-face.blinks .eyes {
      transform-origin: 22px 25px;
      animation: avatar-blink 6s infinite;
      animation-delay: var(--blink-delay, 0s);
    }
    @keyframes avatar-blink {
      0%, 93%, 100% { transform: scaleY(1); }
      96%           { transform: scaleY(0.08); }
    }

    @media (prefers-reduced-motion: reduce) {
      .avatar-face.talking .mo, .avatar-face.blinks .eyes { animation: none; }
    }
  `],
})
export class AvatarFaceComponent {
  id = input.required<AvatarId>();
  size = input<number>(44);
  speaking = input<boolean>(false);
  muted = input<boolean>(false);
  deafened = input<boolean>(false);
  /** Stable per-participant value so ten faces do not blink in lockstep. */
  seed = input<string>('');
  /**
   * Set when the portrait sits inside an element that already names it. Without
   * it a screen reader reads the avatar's name twice on a picker tile and three
   * times on the local participant card.
   */
  decorative = input<boolean>(false);
  /** Off for the picker grid: ten tiles blinking at once buys nothing. */
  blink = input<boolean>(true);

  protected readonly K = FEATURE_INK;
  protected readonly PAINT = PORTRAIT_PAINT;

  // The mustache both the sly and the pompous avatar wear. Defined once: when it
  // was inlined per avatar the two copies drifted apart. Stroked, not filled — a
  // 1.5px filled squiggle reads as a plain line at card size.
  protected readonly STACHE = 'M22 31q-2.7-1.6-5 .4M22 31q2.7-1.6 5 .4';
  protected readonly STACHE_TIPS = 'M17 31.4q-1.5.1-1.3-1.3M27 31.4q1.5.1 1.3-1.3';
  protected readonly clipId = `avatar-clip-${uid++}`;

  protected def = computed(() => avatarDef(this.id()));

  /** Muted outranks speaking, exactly as it does for the card's ring. */
  protected talking = computed(() => this.speaking() && !this.muted() && !this.deafened());

  protected ink = computed(() => (this.muted() ? MUTED_INK : this.def().ink));
  protected skin = computed(() => (this.muted() ? MUTED_SKIN : this.def().skin));

  protected blinkDelay = computed(() => {
    const s = this.seed();
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return `${(Math.abs(h) % 40) / 10}s`;
  });
}
