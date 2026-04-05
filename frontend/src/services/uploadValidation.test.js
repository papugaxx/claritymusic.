

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { describe, expect, it } from 'vitest';
import { validateAudioFile, validateImageFile } from './uploadValidation.js';

describe('uploadValidation', () => {
  it('rejects an image file with an unsupported format', () => {
    const file = { name: 'cover.txt', type: 'text/plain', size: 1024 };

    expect(validateImageFile(file)).toBe('Підтримуються лише PNG, JPG, JPEG або WEBP');
  });

  it('accepts a valid image file', () => {
    const file = { name: 'cover.webp', type: 'image/webp', size: 1024 };

    expect(validateImageFile(file)).toBe('');
  });

  it('accepts an mp3 file by extension', () => {
    const file = { name: 'track.mp3', type: '', size: 1024 };

    expect(validateAudioFile(file)).toBe('');
  });

  it('rejects an audio file that is too large', () => {
    const file = { name: 'track.mp3', type: 'audio/mpeg', size: 30_000_000 };

    expect(validateAudioFile(file)).toContain('Файл занадто великий');
  });
});
