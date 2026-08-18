const { eventToShortcutString } = require('../../content_script.js');

function makeEvent(overrides) {
  return {
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    key: '',
    ...overrides
  };
}

describe('eventToShortcutString', () => {
  describe('returns empty string for non-actionable events', () => {
    test('returns empty string when key is undefined/empty', () => {
      expect(eventToShortcutString(makeEvent({ key: '' }))).toBe('');
    });

    test('returns empty string when key is a standalone modifier: Control', () => {
      expect(eventToShortcutString(makeEvent({ ctrlKey: true, key: 'Control' }))).toBe('');
    });

    test('returns empty string when key is a standalone modifier: Alt', () => {
      expect(eventToShortcutString(makeEvent({ altKey: true, key: 'Alt' }))).toBe('');
    });

    test('returns empty string when key is a standalone modifier: Shift', () => {
      expect(eventToShortcutString(makeEvent({ shiftKey: true, key: 'Shift' }))).toBe('');
    });

    test('returns empty string when key is a standalone modifier: Meta', () => {
      expect(eventToShortcutString(makeEvent({ metaKey: true, key: 'Meta' }))).toBe('');
    });
  });

  describe('single key (no modifiers)', () => {
    test('uppercases a single letter key', () => {
      expect(eventToShortcutString(makeEvent({ key: 'g' }))).toBe('G');
    });

    test('keeps a non-letter key name unchanged', () => {
      expect(eventToShortcutString(makeEvent({ key: 'Enter' }))).toBe('Enter');
    });

    test('keeps a digit key unchanged', () => {
      expect(eventToShortcutString(makeEvent({ key: '1' }))).toBe('1');
    });
  });

  describe('modifier combinations', () => {
    test('Ctrl + letter', () => {
      expect(eventToShortcutString(makeEvent({ ctrlKey: true, key: 'k' }))).toBe('Ctrl+K');
    });

    test('Alt + letter', () => {
      expect(eventToShortcutString(makeEvent({ altKey: true, key: 'g' }))).toBe('Alt+G');
    });

    test('Shift + letter', () => {
      expect(eventToShortcutString(makeEvent({ shiftKey: true, key: 's' }))).toBe('Shift+S');
    });

    test('Ctrl + Shift + letter', () => {
      expect(eventToShortcutString(makeEvent({ ctrlKey: true, shiftKey: true, key: 'k' }))).toBe('Ctrl+Shift+K');
    });

    test('Ctrl + Alt + letter', () => {
      expect(eventToShortcutString(makeEvent({ ctrlKey: true, altKey: true, key: 's' }))).toBe('Ctrl+Alt+S');
    });

    test('Ctrl + Shift + Alt + letter', () => {
      expect(eventToShortcutString(makeEvent({ ctrlKey: true, altKey: true, shiftKey: true, key: 'z' }))).toBe('Ctrl+Alt+Shift+Z');
    });

    test('Meta key is normalized to Ctrl prefix', () => {
      expect(eventToShortcutString(makeEvent({ metaKey: true, key: 'k' }))).toBe('Ctrl+K');
    });
  });

  describe('modifier ordering', () => {
    test('always produces Ctrl before Alt before Shift', () => {
      const result = eventToShortcutString(makeEvent({ ctrlKey: true, altKey: true, shiftKey: true, key: 'x' }));
      expect(result).toBe('Ctrl+Alt+Shift+X');
    });
  });
});
