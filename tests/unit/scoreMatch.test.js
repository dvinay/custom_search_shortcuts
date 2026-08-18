const { scoreMatch } = require('../../background.js');

describe('scoreMatch', () => {
  describe('no match', () => {
    test('returns -1 when name does not contain prefix at all', () => {
      expect(scoreMatch('github', 'xyz', false)).toBe(-1);
    });

    test('returns -1 when prefix is longer than name', () => {
      expect(scoreMatch('go', 'google', false)).toBe(-1);
    });
  });

  describe('exact match', () => {
    test('returns 300 for a plain exact match', () => {
      expect(scoreMatch('github', 'github', false)).toBe(300);
    });

    test('adds 1000 favorite bonus on exact match', () => {
      expect(scoreMatch('github', 'github', true)).toBe(1300);
    });
  });

  describe('starts-with match', () => {
    test('returns 200 when name starts with prefix', () => {
      expect(scoreMatch('github repos', 'github', false)).toBe(200);
    });

    test('adds 1000 favorite bonus on starts-with match', () => {
      expect(scoreMatch('github repos', 'github', true)).toBe(1200);
    });
  });

  describe('word-start match', () => {
    test('returns 150 when a word in the name starts with prefix', () => {
      expect(scoreMatch('stack overflow', 'over', false)).toBe(150);
    });

    test('is case-insensitive via caller convention (caller lowercases)', () => {
      expect(scoreMatch('stack overflow', 'stack', false)).toBe(200);
    });
  });

  describe('substring match', () => {
    test('returns 100 for a substring match not at word start', () => {
      expect(scoreMatch('stackoverflow', 'ack', false)).toBe(100);
    });
  });

  describe('initials match', () => {
    test('returns 80 when prefix matches initials of multi-word name', () => {
      expect(scoreMatch('stack overflow', 'so', false)).toBe(80);
    });

    test('returns 80 for multi-word initials with three words', () => {
      expect(scoreMatch('mozilla developer network', 'mdn', false)).toBe(80);
    });
  });

  describe('priority ordering', () => {
    test('exact > starts-with > word-start > substring > initials', () => {
      const exact     = scoreMatch('go', 'go', false);
      const startWith = scoreMatch('google', 'go', false);
      const wordStart = scoreMatch('google maps', 'maps', false);
      const substring = scoreMatch('django', 'jan', false);
      const initials  = scoreMatch('google maps', 'gm', false);

      expect(exact).toBeGreaterThan(startWith);
      expect(startWith).toBeGreaterThan(wordStart);
      expect(wordStart).toBeGreaterThan(substring);
      expect(substring).toBeGreaterThan(initials);
    });
  });
});
