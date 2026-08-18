const { getDomainForOmni } = require('../../background.js');

describe('getDomainForOmni', () => {
  test('extracts hostname from a standard search URL', () => {
    expect(getDomainForOmni('https://github.com/search?q=%s')).toBe('github.com');
  });

  test('extracts hostname with subdomain', () => {
    expect(getDomainForOmni('https://developer.mozilla.org/en-US/search?q=%s')).toBe('developer.mozilla.org');
  });

  test('works when %s is the only query value', () => {
    expect(getDomainForOmni('https://www.npmjs.com/search?q=%s')).toBe('www.npmjs.com');
  });

  test('returns empty string for a malformed URL', () => {
    expect(getDomainForOmni('not-a-url')).toBe('');
  });

  test('returns empty string for an empty string', () => {
    expect(getDomainForOmni('')).toBe('');
  });

  test('handles URLs without path', () => {
    expect(getDomainForOmni('https://example.com')).toBe('example.com');
  });
});
