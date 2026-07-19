import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { LinkifyPipe } from './linkify.pipe';

/**
 * These tests pin the CURRENT behaviour and, importantly, the security contract:
 *
 * LinkifyPipe calls `bypassSecurityTrustHtml` on the WHOLE message, so it does NOT
 * sanitize HTML itself — it relies on the server HTML-encoding every chat message
 * before it ever reaches the client (see SignalingHub.Sanitize). The tests below
 * therefore verify that:
 *   1. real URLs become anchors with rel="noopener noreferrer",
 *   2. already-encoded text (what the server actually sends) is passed through
 *      verbatim (so it renders as literal text, not markup).
 *
 * If this pipe is ever refactored to own sanitization, update these tests — but do
 * NOT double-encode server-encoded input (that would show users literal `&lt;`).
 */
function render(pipe: LinkifyPipe, sanitizer: DomSanitizer, input: string): string {
  const safe = pipe.transform(input);
  // Unwrap the SafeHtml back to a string for assertions.
  return sanitizer.sanitize(1 /* SecurityContext.HTML */, safe) ?? '';
}

describe('LinkifyPipe', () => {
  let pipe: LinkifyPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LinkifyPipe] });
    pipe = TestBed.inject(LinkifyPipe);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('wraps an http(s) URL in an anchor with safe rel', () => {
    const out = render(pipe, sanitizer, 'see https://voice-room.ru here');
    expect(out).toContain('<a href="https://voice-room.ru"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it('prepends http:// to bare www links', () => {
    const out = render(pipe, sanitizer, 'go to www.example.com');
    expect(out).toContain('href="http://www.example.com"');
  });

  it('only produces http/https hrefs (never javascript: scheme)', () => {
    const out = render(pipe, sanitizer, 'javascript:alert(1) www.ok.com');
    expect(out).not.toContain('href="javascript:');
  });

  it('passes server-encoded text through without re-encoding it', () => {
    // This is what the server actually delivers for a `<b>` typed by a user.
    const encoded = '&lt;b&gt;bold&lt;/b&gt;';
    const out = render(pipe, sanitizer, encoded);
    // Must NOT become &amp;lt; (double-encoding) — entities stay as-is.
    expect(out).toContain('&lt;b&gt;');
    expect(out).not.toContain('&amp;lt;');
  });

  it('returns falsy input unchanged', () => {
    expect(pipe.transform('')).toBe('');
  });
});
