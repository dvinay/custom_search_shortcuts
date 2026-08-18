const { escapeOmni } = require('../../background.js');

describe('escapeOmni', () => {
  test('escapes & as &amp;', () => {
    expect(escapeOmni('cats & dogs')).toBe('cats &amp; dogs');
  });

  test('escapes < as &lt;', () => {
    expect(escapeOmni('<script>')).toBe('&lt;script&gt;');
  });

  test('escapes > as &gt;', () => {
    expect(escapeOmni('a > b')).toBe('a &gt; b');
  });

  test('escapes " as &quot;', () => {
    expect(escapeOmni('"quoted"')).toBe('&quot;quoted&quot;');
  });

  test('escapes all special characters in a combined string', () => {
    expect(escapeOmni('<a href="x&y">z</a>')).toBe('&lt;a href=&quot;x&amp;y&quot;&gt;z&lt;/a&gt;');
  });

  test('returns plain string unchanged when no special characters', () => {
    expect(escapeOmni('Stack Overflow')).toBe('Stack Overflow');
  });

  test('returns empty string unchanged', () => {
    expect(escapeOmni('')).toBe('');
  });
});
