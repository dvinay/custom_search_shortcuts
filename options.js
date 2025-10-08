document.addEventListener('DOMContentLoaded', () => {
  const addUrlForm = document.getElementById('add-url-form');
  const nameInput = document.getElementById('name');
  const urlInput = document.getElementById('url');
  const urlList = document.getElementById('url-list');
  const updateBtn = document.getElementById('update-btn');
  let editingUrlId = null;
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');

  // Load and display saved URLs
  function loadUrls() {
    chrome.storage.sync.get({ urls: [] }, (data) => {
      urlList.innerHTML = '';
      data.urls.forEach(item => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'url-name';
        nameSpan.textContent = item.name;

        const urlSpan = document.createElement('span');
        urlSpan.className = 'url-address';
        urlSpan.textContent = item.url;

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn btn-edit';
        editBtn.dataset.id = item.id;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'btn btn-remove';
        removeBtn.dataset.id = item.id;

        li.appendChild(nameSpan);
        li.appendChild(urlSpan);
        li.appendChild(editBtn);
        li.appendChild(removeBtn);
        urlList.appendChild(li);
      });
    });
  }

  // Add a new URL
  addUrlForm.addEventListener('submit', (e) => {
    if (editingUrlId) {
        e.preventDefault();
        return;
    }
    e.preventDefault();
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if (name && url) {
      chrome.storage.sync.get({ urls: [] }, (data) => {
        const newUrls = data.urls;
        newUrls.push({ id: `custom-search-${Date.now()}`, name, url });
        chrome.storage.sync.set({ urls: newUrls }, () => {
          nameInput.value = '';
          urlInput.value = '';
          loadUrls();
        });
      });
    }
  });

  // Handle edit and remove
  urlList.addEventListener('click', (e) => {
    const urlId = e.target.dataset.id;
    if (e.target.classList.contains('btn-edit')) {
        chrome.storage.sync.get({ urls: [] }, (data) => {
            const urlItem = data.urls.find(item => item.id === urlId);
            if (urlItem) {
                nameInput.value = urlItem.name;
                urlInput.value = urlItem.url;
                editingUrlId = urlId;
                addUrlForm.querySelector('.btn-add').style.display = 'none';
                updateBtn.style.display = 'inline-block';
            }
        });
    }


    if (e.target.classList.contains('btn-remove')) {

      chrome.storage.sync.get({ urls: [] }, (data) => {
        const filteredUrls = data.urls.filter(item => item.id !== urlId);
        chrome.storage.sync.set({ urls: filteredUrls }, () => {
          loadUrls();
        });
      });
    }
  });

  // Export URLs to a JSON file
  exportBtn.addEventListener('click', () => {
    chrome.storage.sync.get({ urls: [] }, (data) => {
      if (data.urls.length === 0) {
        alert('No URLs to export.');
        return;
      }
      const blob = new Blob([JSON.stringify(data.urls, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'custom_shortcuts_urls.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });

  // Trigger file input when import button is clicked
  importBtn.addEventListener('click', () => {
    importFile.click();
  });

    // Update a URL
  updateBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if (name && url && editingUrlId) {
      chrome.storage.sync.get({ urls: [] }, (data) => {
        const newUrls = data.urls.map(item => 
          item.id === editingUrlId ? { ...item, name, url } : item
        );
        chrome.storage.sync.set({ urls: newUrls }, () => {
          nameInput.value = '';
          urlInput.value = '';
          editingUrlId = null;
          addUrlForm.querySelector('.btn-add').style.display = 'inline-block';
          updateBtn.style.display = 'none';
          loadUrls();
        });
      });
    }
  });

  // Handle file import
  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedUrls = JSON.parse(event.target.result);
        if (!Array.isArray(importedUrls)) {
          throw new Error('Invalid format: Not an array.');
        }

        chrome.storage.sync.get({ urls: [] }, (data) => {
          const existingUrls = data.urls;
          const existingUrlSet = new Set(existingUrls.map(item => item.url));
          
          const newUrls = importedUrls.filter(item => 
            item && item.name && item.url && !existingUrlSet.has(item.url)
          );

          if (newUrls.length === 0) {
            alert('No new URLs to import. All URLs in the file already exist.');
            return;
          }

          // Ensure imported URLs have unique IDs
          newUrls.forEach(item => {
            if (!item.id || existingUrls.some(u => u.id === item.id)) {
              item.id = `custom-search-${Date.now()}-${Math.random()}`;
            }
          });

          const mergedUrls = [...existingUrls, ...newUrls];
          chrome.storage.sync.set({ urls: mergedUrls }, () => {
            alert(`${newUrls.length} new URL(s) imported successfully.`);
            loadUrls();
          });
        });
      } catch (error) {
        alert('Error importing file: ' + error.message);
      }
      // Reset file input to allow importing the same file again
      importFile.value = '';
    };
    reader.readAsText(file);
  });

  loadUrls();
});
