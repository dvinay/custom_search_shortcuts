document.addEventListener('DOMContentLoaded', () => {
  // --- Element Selectors ---
  const addUrlForm = document.getElementById('add-url-form');
  const nameInput = document.getElementById('name');
  const urlInput = document.getElementById('url');
  const urlList = document.getElementById('url-list');
  const updateBtn = document.getElementById('update-btn');
  let editingUrlId = null;

  // Pre-fill from URL params (when redirected from context menu or popup)
  const urlParams = new URLSearchParams(window.location.search);
  const prefillName = urlParams.get('prefillName');
  const prefillUrl = urlParams.get('prefillUrl');
  if (prefillName) nameInput.value = prefillName;
  if (prefillUrl) urlInput.value = prefillUrl;

  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');

  const addVariableForm = document.getElementById('add-variable-form');
  const variableNameInput = document.getElementById('variable-name');
  const variableDefaultValueInput = document.getElementById('variable-default-value');
  const variableList = document.getElementById('variable-list');
  const updateVariableBtn = document.getElementById('update-variable-btn');
  let editingVariable = null;

  const addEnvForm = document.getElementById('add-env-form');
  const envNameInput = document.getElementById('env-name');
  const envList = document.getElementById('env-list');

  // --- URL Management ---
  function loadUrls() {
    chrome.storage.sync.get({ urls: [] }, (data) => {
      urlList.innerHTML = '';
      data.urls.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="url-name">${item.name}</span>
          <span class="url-address">${item.url}</span>
          <button class="btn btn-edit" data-id="${item.id}">Edit</button>
          <button class="btn btn-remove" data-id="${item.id}">Remove</button>
        `;
        urlList.appendChild(li);
      });
    });
  }

  addUrlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (editingUrlId) return;
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    if (name && url) {
      chrome.storage.sync.get({ urls: [] }, (data) => {
        const newUrls = [...data.urls, { id: `custom-search-${Date.now()}`, name, url }];
        chrome.storage.sync.set({ urls: newUrls }, () => {
          nameInput.value = '';
          urlInput.value = '';
          loadUrls();
        });
      });
    }
  });

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
        chrome.storage.sync.set({ urls: filteredUrls }, loadUrls);
      });
    }
  });

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

  // --- Variable Management ---
  function loadVariables() {
    chrome.storage.sync.get({ variables: [] }, (data) => {
      variableList.innerHTML = '';
      data.variables.forEach(variable => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="url-name">${variable.name}</span>
          <span class="url-address">${variable.defaultValue}</span>
          <button class="btn btn-edit" data-variable-name="${variable.name}">Edit</button>
          <button class="btn btn-remove" data-variable-name="${variable.name}">Remove</button>
        `;
        variableList.appendChild(li);
      });
    });
  }

  addVariableForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (editingVariable) return;
    const name = variableNameInput.value.trim().toUpperCase();
    const defaultValue = variableDefaultValueInput.value.trim();
    if (name && defaultValue) {
      chrome.storage.sync.get({ variables: [] }, (data) => {
        if (data.variables.some(v => v.name === name)) {
          return alert('Variable with this name already exists.');
        }
        const newVariables = [...data.variables, { name, defaultValue }];
        chrome.storage.sync.set({ variables: newVariables }, () => {
          variableNameInput.value = '';
          variableDefaultValueInput.value = '';
          loadVariables();
          loadEnvs();
        });
      });
    }
  });

  variableList.addEventListener('click', (e) => {
    const variableName = e.target.dataset.variableName;
    if (e.target.classList.contains('btn-edit')) {
      chrome.storage.sync.get({ variables: [] }, (data) => {
        const variable = data.variables.find(v => v.name === variableName);
        if (variable) {
          variableNameInput.value = variable.name;
          variableDefaultValueInput.value = variable.defaultValue;
          editingVariable = variable.name;
          addVariableForm.querySelector('.btn-add').style.display = 'none';
          updateVariableBtn.style.display = 'inline-block';
        }
      });
    }
    if (e.target.classList.contains('btn-remove')) {
      chrome.storage.sync.get({ variables: [], environments: [] }, (data) => {
        const filteredVariables = data.variables.filter(v => v.name !== variableName);
        const updatedEnvs = data.environments.map(env => {
          env.values = env.values.filter(v => v.key !== variableName);
          return env;
        });
        chrome.storage.sync.set({ variables: filteredVariables, environments: updatedEnvs }, () => {
          loadVariables();
          loadEnvs();
        });
      });
    }
  });

  updateVariableBtn.addEventListener('click', () => {
    const name = variableNameInput.value.trim().toUpperCase();
    const defaultValue = variableDefaultValueInput.value.trim();
    if (name && defaultValue && editingVariable) {
      chrome.storage.sync.get({ variables: [], environments: [] }, (data) => {
        if (data.variables.some(v => v.name === name && v.name !== editingVariable)) {
          return alert('Another variable with this name already exists.');
        }
        const newVariables = data.variables.map(v =>
          v.name === editingVariable ? { ...v, name, defaultValue } : v
        );
        const updatedEnvs = data.environments.map(env => {
            env.values = env.values.map(val => val.key === editingVariable ? { ...val, key: name } : val);
            return env;
        });
        chrome.storage.sync.set({ variables: newVariables, environments: updatedEnvs }, () => {
          variableNameInput.value = '';
          variableDefaultValueInput.value = '';
          editingVariable = null;
          addVariableForm.querySelector('.btn-add').style.display = 'inline-block';
          updateVariableBtn.style.display = 'none';
          loadVariables();
          loadEnvs();
        });
      });
    }
  });

  // --- Environment Management ---
    function loadEnvs() {
      chrome.storage.sync.get({ environments: [], variables: [] }, (data) => {
        envList.innerHTML = '';
        data.environments.forEach(env => {
          const li = document.createElement('li');
          const variablesHtml = `<ul>${data.variables.map(variable => {
            const savedValue = env.values.find(v => v.key === variable.name);
            const value = savedValue ? savedValue.value : '';
            return `
              <li data-env-id="${env.id}" data-variable-name="${variable.name}">
                <span class="url-name">${variable.name}</span>
                <span class="url-address">${value || `(default: ${variable.defaultValue})`}</span>
                <div class="button-group">
                  <button class="btn btn-edit btn-edit-env-var">Edit</button>
                </div>
              </li>
            `;
          }).join('')}</ul>`;
  
          li.innerHTML = `
            <div class="collapsible-section" data-env-id="${env.id}">
              <h3 class="collapsible-header">
                <span class="env-name-text">${env.name}</span>
                <div>
                  <button class="btn btn-edit btn-edit-env">Edit</button> 
                  <button class="btn btn-remove btn-remove-env">Remove</button>
                </div>
              </h3>
              <div class="collapsible-content">
                ${variablesHtml}
              </div>
            </div>
          `;
          envList.appendChild(li);
        });
  
        envList.querySelectorAll('.collapsible-header').forEach(header => {
          if (!header.dataset.listenerAttached) {
            header.addEventListener('click', (event) => {
              if (!event.target.closest('button')) {
                  const section = header.closest('.collapsible-section');
                  section.classList.toggle('collapsed');
              }
            });
            header.dataset.listenerAttached = 'true';
          }
        });
  
        envList.querySelectorAll('.btn-edit-env-var').forEach(button => {
          button.addEventListener('click', handleEditEnvVar);
        });
  
        envList.querySelectorAll('.btn-edit-env').forEach(button => {
          button.addEventListener('click', handleEditEnvName);
        });
      });
    }
  
    addEnvForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = envNameInput.value.trim().toUpperCase();
      if (name) {
        chrome.storage.sync.get({ environments: [] }, (data) => {
          if (data.environments.some(e => e.name === name)) {
            return alert('Environment with this name already exists.');
          }
          const newEnvs = [...data.environments, { id: `env-${Date.now()}`, name, values: [] }];
          chrome.storage.sync.set({ environments: newEnvs }, () => {
            envNameInput.value = '';
            loadEnvs();
          });
        });
      }
    });
  
    envList.addEventListener('click', (e) => {
      const envId = e.target.closest('.collapsible-section')?.dataset.envId;
      if (!envId) return;
  
      if (e.target.classList.contains('btn-remove-env')) {
        if (confirm('Are you sure you want to remove this environment?')) {
          chrome.storage.sync.get({ environments: [] }, (data) => {
            const filteredEnvs = data.environments.filter(env => env.id !== envId);
            chrome.storage.sync.set({ environments: filteredEnvs }, loadEnvs);
          });
        }
      }
    });
  
    function handleEditEnvName(e) {
        const header = e.target.closest('.collapsible-header');
        const nameSpan = header.querySelector('.env-name-text');
        const originalName = nameSpan.textContent;
        const envId = e.target.closest('.collapsible-section').dataset.envId;
  
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalName;
        input.className = 'env-name-text';
  
        nameSpan.replaceWith(input);
        input.focus();
  
        const buttonGroup = e.target.parentElement;
        buttonGroup.innerHTML = `
          <button class="btn btn-update btn-save-env">Save</button>
          <button class="btn btn-remove btn-cancel-env">Cancel</button>
        `;
  
        buttonGroup.querySelector('.btn-save-env').addEventListener('click', () => {
          const newName = input.value.trim().toUpperCase();
          if (!newName || newName === originalName) {
            return loadEnvs();
          }
          chrome.storage.sync.get({ environments: [] }, (data) => {
            if (data.environments.some(env => env.name === newName && env.id !== envId)) {
              return alert('Another environment with this name already exists.');
            }
            const newEnvironments = data.environments.map(env => 
              env.id === envId ? { ...env, name: newName } : env
            );
            chrome.storage.sync.set({ environments: newEnvironments }, loadEnvs);
          });
        });
  
        buttonGroup.querySelector('.btn-cancel-env').addEventListener('click', () => loadEnvs());
    }
  
    function handleEditEnvVar(e) {
      const li = e.target.closest('li');
      const valueSpan = li.querySelector('.url-address');
      const buttonGroup = li.querySelector('.button-group');
      const originalValue = valueSpan.textContent.startsWith('(default:') ? '' : valueSpan.textContent;
  
      const input = document.createElement('input');
      input.type = 'text';
      input.value = originalValue;
      input.className = 'url-address';
  
      valueSpan.replaceWith(input);
      input.focus();
  
      buttonGroup.innerHTML = `
        <button class="btn btn-update btn-save-env-var">Save</button>
        <button class="btn btn-remove btn-cancel-env-var">Cancel</button>
      `;
  
      buttonGroup.querySelector('.btn-save-env-var').addEventListener('click', () => handleSaveEnvVar(li, input));
      buttonGroup.querySelector('.btn-cancel-env-var').addEventListener('click', () => loadEnvs());
    }
  
    function handleSaveEnvVar(li, input) {
      const envId = li.dataset.envId;
      const variableName = li.dataset.variableName;
      const newValue = input.value.trim();
  
      chrome.storage.sync.get({ environments: [] }, (data) => {
        const newEnvironments = data.environments.map(env => {
          if (env.id === envId) {
            let variableFound = false;
            env.values = env.values.map(v => {
              if (v.key === variableName) {
                variableFound = true;
                return { ...v, value: newValue };
              }
              return v;
            });
            if (!variableFound) {
              env.values.push({ key: variableName, value: newValue });
            }
          }
          return env;
        });
  
        chrome.storage.sync.set({ environments: newEnvironments }, () => {
          loadEnvs();
        });
      });
    }
  
    // --- Data Management ---
    exportBtn.addEventListener('click', () => {
      chrome.storage.sync.get({ urls: [], variables: [], environments: [] }, (data) => {
        const exportData = {
          urls: data.urls,
          variables: data.variables,
          environments: data.environments
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'custom_shortcuts_data.json';
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
  
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          const { urls, variables, environments } = importedData;
  
          if (!Array.isArray(urls) || !Array.isArray(variables) || !Array.isArray(environments)) {
            throw new Error('Invalid data structure.');
          }
  
          chrome.storage.sync.set({ urls, variables, environments }, () => {
            if (chrome.runtime.lastError) {
              alert('Error saving imported data: ' + chrome.runtime.lastError.message);
            } else {
              alert('Data imported successfully!');
              loadUrls();
              loadVariables();
              loadEnvs();
            }
          });
        } catch (error) {
          alert('Error reading file: ' + error.message);
        }
        importFile.value = '';
      };
      reader.readAsText(file);
    });
  
    // --- Initial Load ---
    loadUrls();
    loadVariables();
    loadEnvs();
  
    // Make top-level sections collapsible
    document.querySelectorAll('#saved-urls-section > .collapsible-header, #saved-variables-section > .collapsible-header, #saved-environments-section > .collapsible-header').forEach(header => {
      header.addEventListener('click', (event) => {
        if (!event.target.closest('button')) {
          const section = header.closest('.collapsible-section');
          section.classList.toggle('collapsed');
        }
      });
    });
  });