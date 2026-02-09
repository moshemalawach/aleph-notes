import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS. Use this whenever rendering user-generated
 * or decrypted HTML content.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty);
}
