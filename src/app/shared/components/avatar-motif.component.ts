import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AvatarId, isRandomAvatarId } from '../avatars';

let uid = 0;

/**
 * The decorative ground behind a participant card.
 *
 * Each avatar gets a motif drawn *about that character* — confetti for the
 * cheerful one, damask for the pompous one, crossbones for the sly one, barbed
 * wire for the angry one — rather than a generic stripe or dot grid. Generic
 * geometry made ten cards look like ten swatches of the same wallpaper in
 * different colours; the point of this layer is that you can tell whose card it
 * is from the pattern alone.
 *
 * Drawn as an SVG `<pattern>` rather than CSS gradients because gradients can
 * express stripes and dots and nothing else. It costs no network request and one
 * rasterised tile.
 *
 * The colour is a mix of the avatar's ink toward `--text-primary`, which flips
 * with the theme — so the motif stays visible on a near-black ground instead of
 * sinking into it, without a second palette.
 */
@Component({
  selector: 'app-avatar-motif',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<svg class="motif" width="100%" height="100%" aria-hidden="true" focusable="false">
  <defs>
    <pattern [attr.id]="pid" patternUnits="userSpaceOnUse"
             [attr.width]="tile()" [attr.height]="tile()"
             [attr.patternTransform]="skew()">
      <g fill="currentColor" stroke="none">
        @switch (kind()) {
          @case ('cheerful') {
            <!-- confetti bits and sparkles, thrown rather than tiled -->
            <rect x="3" y="4" width="4.4" height="2" rx="1" transform="rotate(-25 5 5)"/>
            <rect x="16" y="9.5" width="4.4" height="2" rx="1" transform="rotate(38 18 10)"/>
            <rect x="8" y="18.5" width="4.4" height="2" rx="1" transform="rotate(72 10 19)"/>
            <path d="M20.4 19.6l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9z"/>
            <path d="M5.2 11.6l.7 1.4 1.4.7-1.4.7-.7 1.4-.7-1.4-1.4-.7 1.4-.7z"/>
          }
          @case ('playful') {
            <!-- winks and stuck-out tongues -->
            <path d="M3 9q2.6-3.2 5.2 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M17.4 21.5q2.6-3.2 5.2 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M18.6 4.6q2.4-1 4.1.2.6 1.9-.6 2.9-2.2 1.2-3.5-.2z"/>
            <path d="M6.4 17.4q2.1-.9 3.6.2.5 1.7-.5 2.5-1.9 1.1-3.1-.2z"/>
          }
          @case ('pompous') {
            <!-- damask ornament between hairline rules: expensive wallpaper -->
            <path d="M12 2.4c1.7 3.2 3.6 4.9 6.4 6.4-2.8 1.5-4.7 3.2-6.4 6.4-1.7-3.2-3.6-4.9-6.4-6.4 2.8-1.5 4.7-3.2 6.4-6.4z"
                  fill="none" stroke="currentColor" stroke-width="1.1"/>
            <circle cx="12" cy="8.8" r="1.3"/>
            <path d="M4 18.5h16M4 21.5h16" stroke="currentColor" stroke-width=".8"/>
          }
          @case ('sly') {
            <!-- crossbones and a spare eyepatch -->
            <path d="M4 6.5l7 7M11 6.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            <ellipse cx="22" cy="20.5" rx="3.6" ry="3.1"/>
            <path d="M18.2 18.4 26.6 15.8" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
            <path d="M20 6l4 4M24 6l-4 4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          }
          @case ('scared') {
            <!-- bolts and hairline cracks -->
            <path d="M8.5 2l-3.4 7.6h3.2l-2.2 6.4 6.6-8.6H9.6z"/>
            <path d="M20.5 13l-2.2 5.2h2.7l-1.8 4.8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
            <path d="M2 18.5l3.2 2-3.2 2.2" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
          }
          @case ('angry') {
            <!-- barbed wire -->
            <path d="M0 7.5h26M0 19.5h26" fill="none" stroke="currentColor" stroke-width="1"/>
            <path d="M8.5 4.5l3.4 6M11.9 4.5l-3.4 6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M20.5 16.5l3.4 6M23.9 16.5l-3.4 6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          }
          @case ('sad') {
            <!-- falling tears, three sizes -->
            <path d="M6 3.4c2.8 3.9 2.8 6 0 7.1-2.8-1.1-2.8-3.2 0-7.1z"/>
            <path d="M16.4 13c2.1 3 2.1 4.6 0 5.4-2.1-.8-2.1-2.4 0-5.4z"/>
            <path d="M10.6 20.6c1.5 2.1 1.5 3.2 0 3.8-1.5-.6-1.5-1.7 0-3.8z"/>
          }
          @case ('sleepy') {
            <!-- Z's drifting up past a crescent -->
            <path d="M4 6h6.4l-6.4 7.4h6.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="M18.4 17.4h4.4l-4.4 5h4.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="M24.6 4.4a3.6 3.6 0 1 0 3.2 4.9 4.2 4.2 0 0 1-3.2-4.9z"/>
          }
          @case ('dumb') {
            <!-- ы, at three sizes. The question marks this used to carry moved to
                 the rolled avatar, where an unknown face has the better claim. -->
            <text x="3" y="13" font-size="13" font-weight="800">ы</text>
            <text x="17" y="25" font-size="9" font-weight="800">ы</text>
            <text x="21" y="10" font-size="6.5" font-weight="700" opacity=".8">ы</text>
          }
          @case ('random') {
            <!-- question marks: nobody knows what this one is either -->
            <text x="3" y="14" font-size="15" font-weight="800">?</text>
            <text x="17" y="26" font-size="10" font-weight="800"
                  transform="rotate(14 19 22)">?</text>
            <text x="22" y="9" font-size="7" font-weight="700"
                  transform="rotate(-12 24 7)" opacity=".85">?</text>
          }
          @case ('drunk') {
            <!-- bubbles, off-grid, sizes all over the place -->
            <circle cx="6.4" cy="7.4" r="3.4" fill="none" stroke="currentColor" stroke-width="1.4"/>
            <circle cx="17.6" cy="14.6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.3"/>
            <circle cx="10" cy="20" r="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
            <circle cx="22.4" cy="4.4" r="1.2"/>
            <circle cx="3.4" cy="17.6" r=".9"/>
          }
        }
      </g>
    </pattern>
  </defs>
  <rect width="100%" height="100%" [attr.fill]="'url(#' + pid + ')'"/>
</svg>
`,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
      /* Mixed toward the theme's own text colour so the motif lightens on dark
         grounds and darkens on light ones. One palette, eight themes. */
      color: color-mix(in srgb, var(--av-ink) 62%, var(--text-primary));
      opacity: 0.16;
    }
    .motif { display: block; width: 100%; height: 100%; }
    /* Set here, not as a presentation attribute: SVG attributes do not resolve
       CSS custom properties, so font-family="var(--font-family)" is inert. */
    .motif text { font-family: var(--font-family); }
  `],
})
export class AvatarMotifComponent {
  id = input.required<AvatarId>();

  protected readonly pid = `av-motif-${uid++}`;

  /** Every rolled avatar shares one motif; only the fixed ten have their own. */
  protected kind = computed(() => (isRandomAvatarId(this.id()) ? 'random' : this.id()));

  /** Tile size, per motif — a damask needs a tighter repeat than bubbles. */
  protected tile = computed(() => {
    switch (this.kind()) {
      case 'pompous': return 24;
      case 'sad': return 22;
      case 'angry': return 26;
      case 'sly': return 30;
      case 'sleepy': return 30;
      case 'playful': return 28;
      case 'dumb': return 26;
      case 'random': return 28;
      default: return 26;
    }
  });

  /** A few motifs read better off-axis; the drunk one is deliberately crooked. */
  protected skew = computed(() => {
    switch (this.kind()) {
      case 'drunk': return 'rotate(-9)';
      case 'cheerful': return 'rotate(6)';
      case 'scared': return 'rotate(-4)';
      default: return null;
    }
  });
}
