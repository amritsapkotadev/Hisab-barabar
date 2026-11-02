import { buildInviteUrl, normalizeInviteCode } from '../invite';

describe('buildInviteUrl', () => {
  it('builds the canonical join URL', () => {
    expect(buildInviteUrl('group-1')).toBe('https://hisabbarabar.qzz.io/join/group-1');
  });

  it('keeps a provided https invite link', () => {
    expect(buildInviteUrl('group-1', 'https://example.com/join/x')).toBe(
      'https://example.com/join/x'
    );
  });

  it('adds https to a bare invite link', () => {
    expect(buildInviteUrl('group-1', 'example.com/join/x')).toBe(
      'https://example.com/join/x'
    );
  });

  it('ignores localhost and loopback invite links', () => {
    expect(buildInviteUrl('group-1', 'http://localhost:3000/join/x')).toBe(
      'https://hisabbarabar.qzz.io/join/group-1'
    );
    expect(buildInviteUrl('group-1', 'http://127.0.0.1:3000/join/x')).toBe(
      'https://hisabbarabar.qzz.io/join/group-1'
    );
  });
});

describe('normalizeInviteCode', () => {
  it('trims and uppercases the code', () => {
    expect(normalizeInviteCode('  ab12cd34 ')).toBe('AB12CD34');
  });
});
