

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearRegisterDraft,
  readRegisterDraft,
  readRegisterPassword,
  writeRegisterDraft,
  writeRegisterPassword,
} from './registerDraft.js';

beforeEach(() => {
  clearRegisterDraft();
});

describe('registerDraft', () => {
  it('keeps password only in memory and does not persist it into session storage', () => {
    writeRegisterDraft({ email: 'test@example.com', password: 'secret', displayName: 'Test' });
    writeRegisterPassword('secret');

    expect(readRegisterDraft()).toEqual({ email: 'test@example.com', displayName: 'Test' });
    expect(readRegisterPassword()).toBe('secret');
    expect(window.sessionStorage.getItem('clarity.registerDraft')).not.toContain('secret');
  });

  it('clears both session draft data and in-memory password', () => {
    writeRegisterDraft({ email: 'test@example.com' });
    writeRegisterPassword('secret');

    clearRegisterDraft();

    expect(readRegisterDraft()).toEqual({});
    expect(readRegisterPassword()).toBe('');
  });
});
