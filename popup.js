document.getElementById('options-btn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

const addCurrentUrlBtn = document.getElementById('add-current-url-btn');

// Hide the button if the active tab is the extension's options page
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0] && tabs[0].url &&
      (tabs[0].url.startsWith('chrome-extension://') || tabs[0].url.startsWith('chrome://'))) {
    addCurrentUrlBtn.style.display = 'none';
  }
});

addCurrentUrlBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const tabUrl = tabs[0].url;
      const tabTitle = tabs[0].title || 'New Search';
      chrome.tabs.create({
        url: chrome.runtime.getURL('options.html') +
          '?prefillName=' + encodeURIComponent(tabTitle) +
          '&prefillUrl=' + encodeURIComponent(tabUrl)
      });
    }
  });
});
