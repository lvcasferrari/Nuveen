import { validateNFCTag } from '../nfc';

describe('validateNFCTag', () => {
  it('rejects when no tag was scanned', () => {
    expect(validateNFCTag(null, 'ABC123')).toBe(false);
  });

  it('accepts any tag when none is configured (caller decides policy)', () => {
    expect(validateNFCTag('ANYTHING', null)).toBe(true);
  });

  it('accepts an exact match', () => {
    expect(validateNFCTag('ABC123', 'ABC123')).toBe(true);
  });

  it('rejects a different tag (no checksum/lenient bypass)', () => {
    expect(validateNFCTag('ABC123', 'XYZ999')).toBe(false);
  });
});
