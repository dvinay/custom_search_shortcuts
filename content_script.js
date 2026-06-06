/**
 * Content script for Custom Search Shortcuts.
 * Listens for user-defined keyboard shortcuts and triggers searches
 * on selected text by messaging the background service worker.
 */
(function () {
    let keyboardShortcuts = [];

    // Load shortcuts from storage
    function loadShortcuts() {
        chrome.storage.sync.get({ keyboardShortcuts: [] }, (data) => {
            keyboardShortcuts = data.keyboardShortcuts || [];
        });
    }

    loadShortcuts();

    // Refresh when storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && (changes.keyboardShortcuts || changes.urls)) {
            loadShortcuts();
        }
    });

    /**
     * Converts a KeyboardEvent into a normalized shortcut string.
     * Format: "Ctrl+Shift+K", "Alt+G", "Ctrl+Alt+S", etc.
     * @param {KeyboardEvent} e
     * @returns {string}
     */
    function eventToShortcutString(e) {
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');

        const key = e.key;
        // Ignore undefined keys (e.g. IME composition, dead keys) and standalone modifiers
        if (!key) return '';
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return '';

        // Normalize the key name
        const normalizedKey = key.length === 1 ? key.toUpperCase() : key;
        parts.push(normalizedKey);

        return parts.join('+');
    }

    // Track the latest non-empty selection so it survives modifier key presses
    let lastSelection = '';
    document.addEventListener('selectionchange', () => {
        const text = window.getSelection().toString().trim();
        if (text) lastSelection = text;
    });

    // Use `window` (not `document`) in capture phase to intercept before page scripts
    window.addEventListener('keydown', (e) => {
        if (keyboardShortcuts.length === 0) return;

        // Don't trigger inside input/textarea/contenteditable
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;

        const pressed = eventToShortcutString(e);
        if (!pressed) return;

        const match = keyboardShortcuts.find(s => s.shortcut === pressed);
        if (!match) return;

        // Use current selection first, fall back to the last tracked selection
        const selectedText = window.getSelection().toString().trim() || lastSelection;
        if (!selectedText) return;

        e.preventDefault();
        e.stopPropagation();

        chrome.runtime.sendMessage({
            type: 'KEYBOARD_SHORTCUT_SEARCH',
            urlId: match.urlId,
            selectedText: selectedText
        });
    }, true);
})();
