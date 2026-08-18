/**
 * Unit tests for pure helper functions extracted from popup.js.
 * These functions are tested in isolation without any browser DOM APIs.
 */

const ICON_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0d9488'];

function getIconColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
}

function getInitials(name) {
  return name.split(/[\s_-]+/).map(w => w[0]).join('').substring(0, 2);
}

function resolveUrlWithDefaults(url, variables) {
  return url.replace(/\{\{(.+?)\}\}/g, (match, varName) => {
    const variable = variables.find(v => v.name === varName.trim());
    return variable ? variable.defaultValue : match;
  });
}

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return url.substring(0, 40); }
}

describe('getIconColor', () => {
  test('returns a value from the ICON_COLORS palette', () => {
    const color = getIconColor('GitHub');
    expect(ICON_COLORS).toContain(color);
  });

  test('returns the same color for the same name (deterministic)', () => {
    expect(getIconColor('Google')).toBe(getIconColor('Google'));
  });

  test('returns different colors for different names (not always same bucket)', () => {
    const colors = ['GitHub', 'Google', 'Stack Overflow', 'YouTube', 'NPM', 'Docker', 'Reddit', 'LinkedIn']
      .map(n => getIconColor(n));
    const unique = new Set(colors);
    expect(unique.size).toBeGreaterThan(1);
  });

  test('handles empty string without throwing', () => {
    expect(() => getIconColor('')).not.toThrow();
  });

  test('handles single character names', () => {
    const color = getIconColor('G');
    expect(ICON_COLORS).toContain(color);
  });
});

describe('getInitials', () => {
  test('returns first letter of a single word', () => {
    expect(getInitials('GitHub')).toBe('G');
  });

  test('returns first letters of two words', () => {
    expect(getInitials('Stack Overflow')).toBe('SO');
  });

  test('returns max 2 characters for three words', () => {
    expect(getInitials('Mozilla Developer Network')).toBe('MD');
  });

  test('splits on underscores', () => {
    expect(getInitials('my_search')).toBe('ms');
  });

  test('splits on hyphens', () => {
    expect(getInitials('duck-duck-go')).toBe('dd');
  });

  test('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('');
  });
});

describe('resolveUrlWithDefaults', () => {
  const vars = [
    { name: 'host', defaultValue: 'api.example.com' },
    { name: 'version', defaultValue: 'v2' }
  ];

  test('replaces a single placeholder with its default value', () => {
    expect(resolveUrlWithDefaults('https://{{host}}/search', vars)).toBe('https://api.example.com/search');
  });

  test('replaces multiple placeholders', () => {
    expect(resolveUrlWithDefaults('https://{{host}}/{{version}}/q', vars)).toBe('https://api.example.com/v2/q');
  });

  test('leaves %s intact (query placeholder)', () => {
    expect(resolveUrlWithDefaults('https://{{host}}/search?q=%s', vars)).toBe('https://api.example.com/search?q=%s');
  });

  test('leaves unknown placeholder unchanged', () => {
    expect(resolveUrlWithDefaults('https://{{unknown}}/path', vars)).toBe('https://{{unknown}}/path');
  });

  test('returns the URL unchanged when it has no placeholders', () => {
    const url = 'https://github.com/search?q=%s';
    expect(resolveUrlWithDefaults(url, vars)).toBe(url);
  });

  test('returns the URL unchanged when variables array is empty', () => {
    expect(resolveUrlWithDefaults('https://{{host}}/path', [])).toBe('https://{{host}}/path');
  });
});

describe('getDomain', () => {
  test('extracts hostname from a valid URL', () => {
    expect(getDomain('https://github.com/search?q=test')).toBe('github.com');
  });

  test('extracts hostname with subdomain', () => {
    expect(getDomain('https://developer.mozilla.org/en-US')).toBe('developer.mozilla.org');
  });

  test('returns truncated URL for malformed input', () => {
    const result = getDomain('not-a-valid-url');
    expect(result).toBe('not-a-valid-url'.substring(0, 40));
  });

  test('returns first 40 chars for non-URL that is long', () => {
    const longStr = 'x'.repeat(60);
    expect(getDomain(longStr)).toBe('x'.repeat(40));
  });

  test('handles empty string without throwing', () => {
    expect(() => getDomain('')).not.toThrow();
  });
});
