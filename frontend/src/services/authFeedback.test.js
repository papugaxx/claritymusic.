

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { describe, expect, it } from 'vitest';
import { detectAuthErrorCode, getAuthErrorMessage } from './authFeedback.js';

describe('authFeedback', () => {
  it('detects rate limit responses', () => {
    expect(detectAuthErrorCode({ status: 429 })).toBe('RATE_LIMIT');
  });

  it('returns a localized email confirmation message', () => {
    const message = getAuthErrorMessage(
      { status: 403, data: { requiresEmailConfirmation: true } },
      'ru',
    );

    expect(message).toContain('Сначала подтвердите email');
  });

  it('keeps a user-friendly custom message when it is not technical', () => {
    const message = getAuthErrorMessage({ message: 'Спробуйте інший email' }, 'uk');

    expect(message).toBe('Спробуйте інший email');
  });
});
