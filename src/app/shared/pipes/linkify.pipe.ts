import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'linkify',
  standalone: true
})
export class LinkifyPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string): SafeHtml {
    if (!value) return value;

    // Detect URLs starting with http://, https://, or www.
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    
    const linkedText = value.replace(urlRegex, (url) => {
      let href = url;
      if (!url.startsWith('http')) {
        href = 'http://' + url;
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(linkedText);
  }
}
