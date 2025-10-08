// Create a parent menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'customSearchParent',
    title: 'Custom Search',
    contexts: ['selection']
  });

  // Load saved URLs and create menu items
  loadMenuItems();
});

// Function to load menu items from storage
function loadMenuItems() {
  chrome.storage.sync.get({ urls: [] }, (data) => {
    const urls = data.urls;
    urls.forEach(item => {
      chrome.contextMenus.create({
        id: item.id,
        title: item.name,
        contexts: ['selection'],
        parentId: 'customSearchParent'
      });
    });

    if (urls.length > 0) {
      chrome.contextMenus.create({
        id: 'separator',
        type: 'separator',
        contexts: ['selection'],
        parentId: 'customSearchParent'
      });
    }

    chrome.contextMenus.create({
      id: 'manage',
      title: 'Manage Custom Searches',
      contexts: ['selection'],
      parentId: 'customSearchParent'
    });
  });
}

// Listen for clicks on context menu items
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'manage') {
    chrome.runtime.openOptionsPage();
  } else if (info.parentMenuItemId === 'customSearchParent') {
    chrome.storage.sync.get({ urls: [] }, (data) => {
      const urlItem = data.urls.find(item => item.id === info.menuItemId);
      if (urlItem) {
        const searchUrl = urlItem.url.replace('%s', encodeURIComponent(info.selectionText));
        chrome.tabs.create({ url: searchUrl });
      }
    });
  }
});

// Listen for changes in storage to update menu items
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.urls) {
    // Clear existing custom menu items
    chrome.contextMenus.remove('customSearchParent', () => {
        chrome.contextMenus.create({
            id: 'customSearchParent',
            title: 'Custom Search',
            contexts: ['selection']
          }, () => loadMenuItems());
    });
  }
});
