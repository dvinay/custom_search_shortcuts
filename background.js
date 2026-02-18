// Create a parent menu item on installation
chrome.runtime.onInstalled.addListener(() => {
  createParentMenu();
  loadMenuItems();
});

function createParentMenu() {
    chrome.contextMenus.create({
        id: 'customSearchParent',
        title: 'Custom Search',
        contexts: ['selection']
    });
}

// Function to load menu items from storage
function loadMenuItems() {
  chrome.storage.sync.get({ urls: [], variables: [], environments: [] }, (data) => {
    chrome.contextMenus.removeAll(() => {
      createParentMenu();
      const { urls, environments } = data;

      if (urls && urls.length > 0) {
        urls.forEach(urlItem => {
          const hasVariablesInUrl = /\{\{(.+?)\}\}/.test(urlItem.url);
          const hasEnvironments = environments && environments.length > 0;
          const shouldShowEnvironments = hasVariablesInUrl && hasEnvironments;

          const urlMenuId = shouldShowEnvironments ? `parent_${urlItem.id}` : `${urlItem.id}|NO_ENV`;

          chrome.contextMenus.create({
            id: urlMenuId,
            title: urlItem.name,
            contexts: ['selection'],
            parentId: 'customSearchParent'
          });

          if (shouldShowEnvironments) {
            environments.forEach(env => {
              chrome.contextMenus.create({
                id: `${urlItem.id}|${env.id}`,
                title: env.name,
                contexts: ['selection'],
                parentId: urlMenuId
              });
            });
          }
        });
      }

      // Add a separator and the 'Manage' button
      if (urls && urls.length > 0) {
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

      chrome.contextMenus.create({
        id: 'addCurrentUrl',
        title: 'Add Current Page to Search List',
        contexts: ['selection'],
        parentId: 'customSearchParent'
      });
    });
  });
}

// Function to substitute environment variables in a URL
function substituteEnvVars(url, envId, variables, environments) {
  return url.replace(/\{\{(.+?)\}\}/g, (match, varName) => {
    const trimmedVarName = varName.trim();
    const variable = variables.find(v => v.name === trimmedVarName);

    if (variable) {
      const env = environments.find(e => e.id === envId);
      if (env) {
        const envValue = env.values.find(v => v.key === trimmedVarName);
        if (envValue && envValue.value) {
          return envValue.value; // Use environment-specific value
        }
      }
      return variable.defaultValue || ''; // Fallback to default value
    }
    return match; // If variable is not defined, return the original placeholder
  });
}

// Listen for clicks on context menu items
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'manage') {
    chrome.runtime.openOptionsPage();
    return;
  }

  if (info.menuItemId === 'addCurrentUrl') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] &&
         !(tabs[0].url.startsWith('chrome-extension://') || tabs[0].url.startsWith('chrome://'))) {
        const tabUrl = tabs[0].url;
        const tabTitle = tabs[0].title || 'New Search';
        chrome.tabs.create({
          url: chrome.runtime.getURL('options.html') +
            '?prefillName=' + encodeURIComponent(tabTitle) +
            '&prefillUrl=' + encodeURIComponent(tabUrl)
        });
      }
    });
    return;
  }

  if (info.menuItemId.startsWith('parent_')) return; // Ignore clicks on parent menu items

  const [urlId, envId] = info.menuItemId.split('|');
  if (!urlId) return;

  chrome.storage.sync.get({ urls: [], variables: [], environments: [] }, (data) => {
    const urlItem = data.urls.find(item => item.id === urlId);
    if (urlItem) {
      const resolvedUrl = substituteEnvVars(urlItem.url, envId, data.variables, data.environments);
      const finalUrl = resolvedUrl.replace('%s', encodeURIComponent(info.selectionText));
      chrome.tabs.create({ url: finalUrl });
    }
  });
});

// Listen for changes in storage to update menu items
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.urls || changes.variables || changes.environments)) {
    loadMenuItems();
  }
});
