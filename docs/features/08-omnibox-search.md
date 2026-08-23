# Omnibox Search

Search using any of your shortcuts directly from Chrome's address bar, with live auto-suggestions as you type.

## Step-by-Step

1. Click on Chrome's address bar

2. Type the keyword `cs` and press **Tab** (or **Space**) to enter the extension's omnibox mode

   ![Typing "cs" and pressing Tab in the address bar](../images/features/omnibox-search-01.png)

3. Start typing a shortcut name — matching search URLs appear as suggestions, showing the shortcut name, domain, category, and favorite status

   ![Auto-suggestions appearing while typing](../images/features/omnibox-search-02.png)

4. Continue typing your search query after the shortcut name, e.g.:
   ```
   cs google hello world
   ```

   ![Full omnibox query with shortcut name and search text](../images/features/omnibox-search-03.png)

5. Press **Enter** — the matched shortcut opens with your query, exactly as if you had used the context menu

   ![Search result opened from the omnibox](../images/features/omnibox-search-04.png)

## Matching Behavior

- **Smart matching** ranks suggestions by exact fit, prefix match, word-start match, and initials, so the most relevant shortcut is always easy to reach.
- **Fallback search**: If no shortcut name matches what you typed, the entire input is used as a search query against the first available URL.

## Related Features

- [Custom Search Engines](01-custom-search-engines.md)
- [Keyboard Shortcuts](07-keyboard-shortcuts.md)
