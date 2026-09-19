/**
 * SprintPulse Centralized Sanitization & Input Security Utility
 * Provides defense-in-depth sanitization against XSS, control characters,
 * and malicious payloads across forms, storage, and AI prompts.
 */

export const Sanitizer = {
  /**
   * Sanitizes generic single-line text (names, titles, departments, invite codes).
   * Strips HTML tags, removes unsafe control characters, trims whitespace,
   * and enforces an optional maximum length limit.
   */
  sanitizeText(input: unknown, maxLength: number = 255): string {
    if (input === null || input === undefined) return '';
    let str = String(input).trim();

    // Strip HTML tags and script tags defensively
    str = str.replace(/<[^>]*>?/gm, '');

    // Strip non-printable / dangerous control characters except standard whitespace
    str = str.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '');

    if (str.length > maxLength) {
      str = str.slice(0, maxLength);
    }
    return str.trim();
  },

  /**
   * Sanitizes multi-line narrative content (standup text, blocker descriptions, notes).
   * Preserves intentional newlines and spaces, but strips dangerous markup and control codes.
   */
  sanitizeMultiline(input: unknown, maxLength: number = 5000): string {
    if (input === null || input === undefined) return '';
    let str = String(input).trim();

    // Remove script and style blocks entirely along with their inner content
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Strip all other HTML/XML tags
    str = str.replace(/<[^>]+>/g, '');

    // Strip control characters except newline (\n), carriage return (\r), and tab (\t)
    str = str.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '');

    if (str.length > maxLength) {
      str = str.slice(0, maxLength);
    }
    return str.trim();
  },

  /**
   * Sanitizes email addresses strictly.
   */
  sanitizeEmail(input: unknown): string {
    if (!input) return '';
    const clean = String(input).trim().toLowerCase();
    // Strip tags or control characters
    return clean.replace(/<[^>]*>?/gm, '').replace(/[\u0000-\u001F\u007F-\u009F\s]/g, '').slice(0, 128);
  },

  /**
   * Sanitizes project invite codes (e.g. "ECP-7K42").
   */
  sanitizeInviteCode(input: unknown): string {
    if (!input) return '';
    return String(input)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 20);
  },

  /**
   * Validates if email format is plausible.
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
};
