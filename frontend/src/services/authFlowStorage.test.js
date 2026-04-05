

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { beforeEach, describe, expect, it } from 'vitest';
import { clearAuthFlow, readRememberedAuthEmail, rememberAuthEmail } from './authFlowStorage.js';

beforeEach(() => {
  clearAuthFlow();
});

describe('authFlowStorage', () => {
  it('remembers a trimmed auth email', () => {
    rememberAuthEmail('  user@example.com  ');

    expect(readRememberedAuthEmail()).toBe('user@example.com');
  });

  it('clears the remembered auth email', () => {
    rememberAuthEmail('user@example.com');
    clearAuthFlow();

    expect(readRememberedAuthEmail()).toBe('');
  });
});
