const HISTORY_STORAGE_KEY = 'qrcode_history';
const THEME_STORAGE_KEY = 'theme_preference';
const AUTO_SAVE_KEY = 'qrcode_autosave';
const MAX_HISTORY_ITEMS = 20;

const elements = {
  themeToggle: document.getElementById('themeToggle'),
  urlInput: document.getElementById('urlInput'),
  nameInputField: document.getElementById('nameInputField'),
  logoUpload: document.getElementById('logoUpload'),
  logoFileLabel: document.getElementById('logoFileLabel'),
  removeLogoBtn: document.getElementById('removeLogoBtn'),
  generateButton: document.getElementById('generateButton'),
  generateButtonTitle: document.getElementById('generateButtonTitle'),
  generateButtonWifi: document.getElementById('generateButtonWifi'),
  resultSection: document.getElementById('resultSection'),
  qrcodeCanvas: document.getElementById('qrcodeCanvas'),
  qrcodeTitleContainer: document.getElementById('qrcodeTitleContainer'),
  downloadButton: document.getElementById('downloadButton'),
  downloadText: document.getElementById('downloadText'),
  downloadFormat: document.getElementById('downloadFormat'),
  historyList: document.getElementById('historyList'),
  privacyToggle: document.getElementById('privacyToggle'),
  privacyIcon: document.getElementById('privacyIcon'),
  clearButton: document.getElementById('clearButton'),
  modalOverlay: document.getElementById('modalOverlay'),
  modalClose: document.getElementById('modalClose'),
  modalCancel: document.getElementById('modalCancel'),
  modalSave: document.getElementById('modalSave'),
  nameInput: document.getElementById('nameInput'),
  qrcodeViewerOverlay: document.getElementById('qrcodeViewerOverlay'),
  qrcodeViewerClose: document.getElementById('qrcodeViewerClose'),
  qrcodeViewerImage: document.getElementById('qrcodeViewerImage')
};

let state = {
  currentLogo: null,
  currentWifiLogo: null,
  currentQRCode: null,
  currentQRCodeSVG: null,
  editingHistoryId: null,
  privacyMode: false,
  currentTab: 'url-photo',
  currentQRType: 'url-photo'
};

let importedData = [];

// Auto-save Functions
function saveFormData() {
  const formData = {
    currentTab: state.currentTab,
    urlPhoto: {
      name: elements.nameInputField?.value || '',
      url: elements.urlInput?.value || '',
      hasLogo: !!state.currentLogo
    },
    urlTitle: {
      title: document.getElementById('titleInput')?.value || '',
      url: document.getElementById('urlInputTitle')?.value || '',
      titleColor: document.getElementById('titleColor')?.value || '#003366'
    },
    wifi: {
      ssid: document.getElementById('wifiName')?.value || '',
      password: document.getElementById('wifiPassword')?.value || '',
      security: document.getElementById('wifiSecurity')?.value || 'WPA',
      customType: document.getElementById('wifiCustomType')?.value || 'title',
      wifiTitle: document.getElementById('wifiTitleInput')?.value || '',
      wifiTitleColor: document.getElementById('wifiTitleColor')?.value || '#003366',
      hasWifiLogo: !!state.currentWifiLogo
    }
  };
  
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(formData));
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
  }
}

function loadFormData() {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (!saved) return;
    
    const formData = JSON.parse(saved);
    
    // Restore tab
    if (formData.currentTab) {
      switchTab(formData.currentTab);
    }
    
    // Restore URL Photo tab
    if (formData.urlPhoto) {
      if (elements.nameInputField && formData.urlPhoto.name) {
        elements.nameInputField.value = formData.urlPhoto.name;
      }
      if (elements.urlInput && formData.urlPhoto.url) {
        elements.urlInput.value = formData.urlPhoto.url;
      }
    }
    
    // Restore URL Title tab
    if (formData.urlTitle) {
      const titleInput = document.getElementById('titleInput');
      const urlInputTitle = document.getElementById('urlInputTitle');
      const titleColor = document.getElementById('titleColor');
      
      if (titleInput && formData.urlTitle.title) {
        titleInput.value = formData.urlTitle.title;
        // Trigger char counter update
        titleInput.dispatchEvent(new Event('input'));
      }
      if (urlInputTitle && formData.urlTitle.url) {
        urlInputTitle.value = formData.urlTitle.url;
      }
      if (titleColor && formData.urlTitle.titleColor) {
        titleColor.value = formData.urlTitle.titleColor;
      }
    }
    
    // Restore WiFi tab
    if (formData.wifi) {
      const wifiName = document.getElementById('wifiName');
      const wifiPassword = document.getElementById('wifiPassword');
      const wifiSecurity = document.getElementById('wifiSecurity');
      const wifiCustomType = document.getElementById('wifiCustomType');
      const wifiTitleInput = document.getElementById('wifiTitleInput');
      const wifiTitleColor = document.getElementById('wifiTitleColor');
      
      if (wifiName && formData.wifi.ssid) wifiName.value = formData.wifi.ssid;
      if (wifiPassword && formData.wifi.password) wifiPassword.value = formData.wifi.password;
      if (wifiSecurity && formData.wifi.security) wifiSecurity.value = formData.wifi.security;
      if (wifiCustomType && formData.wifi.customType) {
        wifiCustomType.value = formData.wifi.customType;
        wifiCustomType.dispatchEvent(new Event('change'));
      }
      if (wifiTitleInput && formData.wifi.wifiTitle) wifiTitleInput.value = formData.wifi.wifiTitle;
      if (wifiTitleColor && formData.wifi.wifiTitleColor) wifiTitleColor.value = formData.wifi.wifiTitleColor;
    }
  } catch (error) {
    console.error('Erro ao carregar dados salvos:', error);
  }
}

// Auto-save on input changes
function setupAutoSave() {
  // URL Photo tab
  if (elements.nameInputField) {
    elements.nameInputField.addEventListener('input', saveFormData);
  }
  if (elements.urlInput) {
    elements.urlInput.addEventListener('input', saveFormData);
  }
  if (elements.logoUpload) {
    elements.logoUpload.addEventListener('change', () => {
      setTimeout(saveFormData, 100);
    });
  }
  
  // URL Title tab
  const titleInput = document.getElementById('titleInput');
  const urlInputTitle = document.getElementById('urlInputTitle');
  const titleColor = document.getElementById('titleColor');
  
  if (titleInput) titleInput.addEventListener('input', saveFormData);
  if (urlInputTitle) urlInputTitle.addEventListener('input', saveFormData);
  if (titleColor) titleColor.addEventListener('change', saveFormData);
  
  // WiFi tab
  const wifiName = document.getElementById('wifiName');
  const wifiPassword = document.getElementById('wifiPassword');
  const wifiSecurity = document.getElementById('wifiSecurity');
  const wifiCustomType = document.getElementById('wifiCustomType');
  const wifiTitleInput = document.getElementById('wifiTitleInput');
  const wifiTitleColor = document.getElementById('wifiTitleColor');
  const wifiLogoUpload = document.getElementById('wifiLogoUpload');
  
  if (wifiName) wifiName.addEventListener('input', saveFormData);
  if (wifiPassword) wifiPassword.addEventListener('input', saveFormData);
  if (wifiSecurity) wifiSecurity.addEventListener('change', saveFormData);
  if (wifiCustomType) wifiCustomType.addEventListener('change', saveFormData);
  if (wifiTitleInput) wifiTitleInput.addEventListener('input', saveFormData);
  if (wifiTitleColor) wifiTitleColor.addEventListener('change', saveFormData);
  if (wifiLogoUpload) {
    wifiLogoUpload.addEventListener('change', () => {
      setTimeout(saveFormData, 100);
    });
  }
}

// Tabs System
function switchTab(tabId) {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const tabsDropdown = document.getElementById('tabsDropdown');
  
  // Remove active from all
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));
  
  // Add active to selected
  const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
  if (selectedButton) {
    selectedButton.classList.add('active');
  }
  
  document.getElementById(`tab-${tabId}`).classList.add('active');
  
  // Update dropdown if exists
  if (tabsDropdown) {
    tabsDropdown.value = tabId;
  }
  
  state.currentTab = tabId;
  state.currentQRType = tabId;
  
  // Hide result section when switching tabs
  elements.resultSection.classList.remove('show');
  
  // Save current tab
  saveFormData();
}

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabsDropdown = document.getElementById('tabsDropdown');

  // Desktop tabs
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Mobile dropdown
  if (tabsDropdown) {
    tabsDropdown.addEventListener('change', (e) => {
      switchTab(e.target.value);
    });
    
    // Set initial value
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
      tabsDropdown.value = activeTab.getAttribute('data-tab');
    }
  }
}

// Theme Functions
function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
}

function setStoredTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function getEffectiveTheme() {
  const preference = getStoredTheme();
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

function setTheme(preference) {
  const effectiveTheme = preference === 'system' ? getSystemTheme() : preference;
  document.body.setAttribute('data-theme', effectiveTheme);
  setStoredTheme(preference);
  updateThemeIcon(effectiveTheme);
  updateThemeDropdown(preference);
}

function updateThemeIcon(effectiveTheme) {
  const preference = getStoredTheme();
  const sunIcon = document.querySelector('.theme-icon-sun');
  const moonIcon = document.querySelector('.theme-icon-moon');
  const systemIcon = document.querySelector('.theme-icon-system');
  
  // Hide all icons first
  if (sunIcon) {
    sunIcon.style.display = 'none';
    sunIcon.style.opacity = '0';
  }
  if (moonIcon) {
    moonIcon.style.display = 'none';
    moonIcon.style.opacity = '0';
  }
  if (systemIcon) {
    systemIcon.style.display = 'none';
    systemIcon.style.opacity = '0';
  }
  
  // Show the appropriate icon based on preference
  if (preference === 'system') {
    if (systemIcon) {
      systemIcon.style.display = 'block';
      systemIcon.style.opacity = '1';
    }
  } else if (preference === 'light') {
    if (sunIcon) {
      sunIcon.style.display = 'block';
      sunIcon.style.opacity = '1';
    }
  } else if (preference === 'dark') {
    if (moonIcon) {
      moonIcon.style.display = 'block';
      moonIcon.style.opacity = '1';
    }
  }
}

function updateThemeDropdown(preference) {
  const options = document.querySelectorAll('.theme-option');
  options.forEach(option => {
    if (option.dataset.theme === preference) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

function toggleThemeDropdown() {
  const dropdown = document.getElementById('themeDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

function closeThemeDropdown() {
  const dropdown = document.getElementById('themeDropdown');
  if (dropdown) {
    dropdown.classList.remove('active');
  }
}

function selectTheme(themePreference) {
  setTheme(themePreference);
  closeThemeDropdown();
}

function initializeTheme() {
  const savedPreference = getStoredTheme();
  setTheme(savedPreference);
  
  // Listen for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (getStoredTheme() === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        document.body.setAttribute('data-theme', newTheme);
        updateThemeIcon(newTheme);
      }
    });
  }
}

// History Functions
function getStoredHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function setStoredHistory(history) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addToHistory(name, url, qrcodeData) {
  const history = getStoredHistory();
  
  const historyItem = {
    id: generateId(),
    name: name || `QR Code ${history.length + 1}`,
    url: url,
    qrcodeData: qrcodeData,
    createdAt: new Date().toISOString()
  };
  
  history.unshift(historyItem);
  
  if (history.length > MAX_HISTORY_ITEMS) {
    history.splice(MAX_HISTORY_ITEMS);
  }
  
  setStoredHistory(history);
  renderHistory();
}

function renderHistory() {
  const history = getStoredHistory();
  const historyList = elements.historyList;
  
  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">Nenhum QR Code gerado ainda</div>';
    return;
  }
  
  historyList.innerHTML = '';
  
  history.forEach(item => {
    const historyItem = createHistoryItemElement(item);
    historyList.appendChild(historyItem);
  });
}

function createHistoryItemElement(item) {
  const div = document.createElement('div');
  div.className = 'history-item';
  div.setAttribute('data-history-id', item.id);
  
  const qrcodeDisplay = state.privacyMode 
    ? '<div class="history-qrcode-placeholder">***</div>'
    : `<img src="${item.qrcodeData}" alt="QR Code ${escapeHtml(item.name)}" class="history-qrcode-image qrcode-clickable" data-qrcode="${item.qrcodeData}">`;
  
  div.innerHTML = `
    <div class="history-item-content">
      <div class="history-qrcode-wrapper">
        ${qrcodeDisplay}
      </div>
      
      <div class="history-item-info">
        <div class="history-item-header">
          <div class="history-name" title="Clique para editar">${escapeHtml(item.name)}</div>
          <div class="history-actions">
            <button class="history-action-button history-edit-button" title="Editar nome" aria-label="Editar nome">
              ✏️
            </button>
            <button class="history-action-button history-delete-button" title="Excluir" aria-label="Excluir">
              🗑️
            </button>
          </div>
        </div>
        
        <div class="history-url-preview">
          ${state.privacyMode ? '***' : escapeHtml(item.url)}
        </div>
        
        <div class="history-download-section">
          <div class="history-download-format-selector">
            <label for="historyDownloadFormat${item.id}" class="format-label">Formato:</label>
            <select id="historyDownloadFormat${item.id}" class="format-select history-format-select" data-item-id="${item.id}">
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
            </select>
          </div>
          <button class="history-download-button" type="button" data-item-id="${item.id}">Baixar</button>
        </div>
      </div>
    </div>
  `;
  
  addHistoryItemListeners(div, item);
  
  return div;
}

function addHistoryItemListeners(element, item) {
  const downloadButton = element.querySelector('.history-download-button');
  const formatSelect = element.querySelector('.history-format-select');
  
  downloadButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    const format = formatSelect ? formatSelect.value : 'png';
    await downloadQRCode(item.qrcodeData, item.name, format);
  });
  
  const editButton = element.querySelector('.history-edit-button');
  editButton.addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(item.id);
  });
  
  const deleteButton = element.querySelector('.history-delete-button');
  deleteButton.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteHistoryItem(item.id);
  });
  
  const nameElement = element.querySelector('.history-name');
  nameElement.addEventListener('click', () => {
    openEditModal(item.id);
  });
  
  const qrcodeImage = element.querySelector('.history-qrcode-image');
  if (qrcodeImage) {
    qrcodeImage.addEventListener('click', (e) => {
      e.stopPropagation();
      openQRCodeViewer(item.qrcodeData);
    });
  }
}

// Logo Functions
function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.type !== 'image/png') {
    alert('Por favor, selecione apenas arquivos PNG.');
    return;
  }
  
  if (file.size > 500000) {
    alert('O arquivo é muito grande. Máximo: 500KB');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    state.currentLogo = e.target.result;
    elements.logoFileLabel.textContent = file.name;
    elements.removeLogoBtn.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  state.currentLogo = null;
  elements.logoUpload.value = '';
  elements.logoFileLabel.textContent = 'Nenhum arquivo selecionado';
  elements.removeLogoBtn.style.display = 'none';
  saveFormData();
}

function handleWifiLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.type !== 'image/png') {
    alert('Por favor, selecione apenas arquivos PNG.');
    return;
  }
  
  if (file.size > 500000) {
    alert('O arquivo é muito grande. Máximo: 500KB');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    state.currentWifiLogo = e.target.result;
    document.getElementById('wifiLogoFileLabel').textContent = file.name;
    document.getElementById('removeWifiLogoBtn').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function removeWifiLogo() {
  state.currentWifiLogo = null;
  document.getElementById('wifiLogoUpload').value = '';
  document.getElementById('wifiLogoFileLabel').textContent = 'Nenhum arquivo selecionado';
  document.getElementById('removeWifiLogoBtn').style.display = 'none';
  saveFormData();
}

async function addLogoToCanvas(canvas, ctx, logoData) {
  return new Promise((resolve) => {
    if (!logoData) {
      resolve();
      return;
    }
    
    const logoImg = new Image();
    logoImg.onload = function() {
      const logoSize = 60;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerX - logoSize/2 - 5, centerY - logoSize/2 - 5, logoSize + 10, logoSize + 10);
      ctx.drawImage(logoImg, centerX - logoSize/2, centerY - logoSize/2, logoSize, logoSize);
      resolve();
    };
    logoImg.onerror = function() {
      resolve();
    };
    logoImg.src = logoData;
  });
}

// QR Code Generation Functions
async function generateQRCode() {
  const url = elements.urlInput.value.trim();
  
  if (!url) {
    elements.urlInput.classList.add('input-error');
    elements.urlInput.focus();
    return;
  }
  
  try {
    new URL(url);
  } catch (error) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      elements.urlInput.value = 'https://' + url;
    } else {
      elements.urlInput.classList.add('input-error');
      elements.urlInput.focus();
      return;
    }
  }
  
  elements.urlInput.classList.remove('input-error');
  elements.generateButton.classList.add('loading');
  elements.generateButton.disabled = true;
  
  try {
    const finalUrl = elements.urlInput.value.trim();
    const canvas = elements.qrcodeCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    canvas.width = 300;
    canvas.height = 300;
    
    const qrContainer = document.createElement('div');
    qrContainer.style.position = 'absolute';
    qrContainer.style.left = '-9999px';
    document.body.appendChild(qrContainer);
    
    const qrcode = new QRCode(qrContainer, {
      text: finalUrl,
      width: 300,
      height: 300,
      colorDark: '#1a1a1a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    
    await new Promise((resolve, reject) => {
      const checkQR = () => {
        const qrImg = qrContainer.querySelector('img');
        const qrCanvas = qrContainer.querySelector('canvas');
        
        if (qrImg) {
          if (qrImg.complete) {
            ctx.drawImage(qrImg, 0, 0, 300, 300);
            resolve();
          } else {
            qrImg.onload = () => {
              ctx.drawImage(qrImg, 0, 0, 300, 300);
              resolve();
            };
            qrImg.onerror = () => reject(new Error('Erro ao carregar imagem do QR Code'));
          }
        } else if (qrCanvas) {
          ctx.drawImage(qrCanvas, 0, 0, 300, 300);
          resolve();
        } else {
          setTimeout(checkQR, 100);
        }
      };
      
      setTimeout(checkQR, 100);
      setTimeout(() => reject(new Error('Timeout ao gerar QR Code')), 5000);
    });
    
    document.body.removeChild(qrContainer);
    
    if (state.currentLogo) {
      await addLogoToCanvas(canvas, ctx, state.currentLogo);
    }
    
    state.currentQRCode = canvas.toDataURL('image/png');
    
    let name = `QR Code ${getStoredHistory().length + 1}`;
    if (elements.nameInputField && elements.nameInputField.value.trim()) {
      name = elements.nameInputField.value.trim();
    }
    
    addToHistory(name, finalUrl, state.currentQRCode);
    elements.resultSection.classList.add('show');
    elements.qrcodeCanvas.style.display = 'block';
    elements.qrcodeTitleContainer.style.display = 'none';
    
  } catch (error) {
    alert('Erro ao gerar QR Code. Por favor, tente novamente.');
  } finally {
    elements.generateButton.classList.remove('loading');
    elements.generateButton.disabled = false;
  }
}

async function generateQRCodeWithTitle() {
  const title = document.getElementById('titleInput').value.trim();
  const url = document.getElementById('urlInputTitle').value.trim();
  const titleColor = document.getElementById('titleColor').value;
  
  if (!title || !url) {
    alert('Por favor, preencha todos os campos');
    return;
  }
  
  if (title.length > 5) {
    alert('O título deve ter no máximo 5 caracteres');
    return;
  }
  
  try {
    new URL(url);
  } catch (error) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      document.getElementById('urlInputTitle').value = 'https://' + url;
    } else {
      alert('Por favor, insira um URL válido');
      return;
    }
  }
  
  elements.generateButtonTitle.classList.add('loading');
  elements.generateButtonTitle.disabled = true;
  
  try {
    const finalUrl = document.getElementById('urlInputTitle').value.trim();
    const container = elements.qrcodeTitleContainer;
    container.innerHTML = '';
    container.style.display = 'block';
    elements.qrcodeCanvas.style.display = 'none';
    
    // Create title element
    const titleElement = document.createElement('div');
    titleElement.className = 'title-in-qr-text';
    titleElement.style.color = titleColor;
    titleElement.textContent = title.toUpperCase();
    container.appendChild(titleElement);
    
    // Generate QR code
    new QRCode(container, {
      text: finalUrl,
      width: 300,
      height: 300,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
      margin: 2
    });
    
    // Capture as image
    setTimeout(async () => {
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff'
      });
      const qrcodeData = canvas.toDataURL('image/png');
      state.currentQRCode = qrcodeData;
      
      addToHistory(title, finalUrl, qrcodeData);
      elements.resultSection.classList.add('show');
    }, 500);
    
  } catch (error) {
    alert('Erro ao gerar QR Code. Por favor, tente novamente.');
  } finally {
    elements.generateButtonTitle.classList.remove('loading');
    elements.generateButtonTitle.disabled = false;
  }
}

function generateWiFiString(ssid, password, security) {
  const securityType = security === 'nopass' ? 'nopass' : security;
  const passwordPart = securityType === 'nopass' ? '' : `P:${password}`;
  return `WIFI:T:${securityType};S:${ssid};${passwordPart};;`;
}

async function generateWiFiQRCode() {
  const ssid = document.getElementById('wifiName').value.trim();
  const password = document.getElementById('wifiPassword').value.trim();
  const security = document.getElementById('wifiSecurity').value;
  const customType = document.getElementById('wifiCustomType').value;
  const useTitle = customType === 'title';
  const useLogo = customType === 'logo';
  
  if (!ssid) {
    alert('Por favor, informe o nome da rede WiFi');
    return;
  }
  
  if (security !== 'nopass' && !password) {
    alert('Por favor, informe a senha da rede WiFi');
    return;
  }
  
  elements.generateButtonWifi.classList.add('loading');
  elements.generateButtonWifi.disabled = true;
  
  try {
    const wifiString = generateWiFiString(ssid, password, security);
    const canvas = elements.qrcodeCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    canvas.width = 300;
    canvas.height = 300;
    
    const qrContainer = document.createElement('div');
    qrContainer.style.position = 'absolute';
    qrContainer.style.left = '-9999px';
    document.body.appendChild(qrContainer);
    
    const qrcode = new QRCode(qrContainer, {
      text: wifiString,
      width: 300,
      height: 300,
      colorDark: '#1a1a1a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    
    await new Promise((resolve, reject) => {
      const checkQR = () => {
        const qrImg = qrContainer.querySelector('img');
        const qrCanvas = qrContainer.querySelector('canvas');
        
        if (qrImg) {
          if (qrImg.complete) {
            ctx.drawImage(qrImg, 0, 0, 300, 300);
            resolve();
          } else {
            qrImg.onload = () => {
              ctx.drawImage(qrImg, 0, 0, 300, 300);
              resolve();
            };
            qrImg.onerror = () => reject(new Error('Erro ao carregar imagem do QR Code'));
          }
        } else if (qrCanvas) {
          ctx.drawImage(qrCanvas, 0, 0, 300, 300);
          resolve();
        } else {
          setTimeout(checkQR, 100);
        }
      };
      
      setTimeout(checkQR, 100);
      setTimeout(() => reject(new Error('Timeout ao gerar QR Code')), 5000);
    });
    
    document.body.removeChild(qrContainer);
    
    if (useTitle) {
      const title = document.getElementById('wifiTitleInput').value.trim() || 'WiFi';
      const titleColor = document.getElementById('wifiTitleColor').value;
      
      if (title.length > 5) {
        alert('O título deve ter no máximo 5 caracteres');
        return;
      }
      
      // Add title overlay
      const logoSize = 60;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerX - 45, centerY - 20, 90, 40);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - 45, centerY - 20, 90, 40);
      
      ctx.fillStyle = titleColor;
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title.toUpperCase(), centerX, centerY);
    } else if (useLogo && state.currentWifiLogo) {
      await addLogoToCanvas(canvas, ctx, state.currentWifiLogo);
    }
    
    state.currentQRCode = canvas.toDataURL('image/png');
  
    const name = ssid || `WiFi ${getStoredHistory().length + 1}`;
    addToHistory(name, wifiString, state.currentQRCode);
    elements.resultSection.classList.add('show');
    elements.qrcodeCanvas.style.display = 'block';
    elements.qrcodeTitleContainer.style.display = 'none';
    
  } catch (error) {
    alert('Erro ao gerar QR Code. Por favor, tente novamente.');
  } finally {
    elements.generateButtonWifi.classList.remove('loading');
    elements.generateButtonWifi.disabled = false;
  }
  }

// Download Functions
async function downloadQRCode(qrcodeData, name, format = 'png') {
  try {
    const link = document.createElement('a');
    
    if (format === 'svg') {
      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="300">
        <image x="0" y="0" width="300" height="300" xlink:href="${qrcodeData}"/>
      </svg>`;
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      link.download = `${name || 'qrcode'}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      link.download = `${name || 'qrcode'}.png`;
      link.href = qrcodeData;
      link.click();
    }
  } catch (error) {
    alert('Erro ao baixar QR Code.');
  }
}

async function downloadMainQRCode() {
  if (!state.currentQRCode) return;
  
  let name = 'qrcode';
  if (state.currentQRType === 'url-photo' && elements.nameInputField && elements.nameInputField.value.trim()) {
    name = elements.nameInputField.value.trim();
  } else if (state.currentQRType === 'url-title') {
    name = document.getElementById('titleInput').value.trim() || 'qrcode';
  } else if (state.currentQRType === 'wifi') {
    name = document.getElementById('wifiName').value.trim() || 'wifi';
  } else {
    const history = getStoredHistory();
    name = `QR Code ${history.length + 1}`;
  }
  
  const format = elements.downloadFormat ? elements.downloadFormat.value : 'png';
  
  if (state.currentQRType === 'url-title' && elements.qrcodeTitleContainer.style.display !== 'none') {
    const container = elements.qrcodeTitleContainer;
    const canvas = await html2canvas(container, { backgroundColor: '#ffffff' });
    const qrcodeData = canvas.toDataURL('image/png');
    await downloadQRCode(qrcodeData, name, format);
  } else {
  await downloadQRCode(state.currentQRCode, name, format);
  }
  
  elements.downloadButton.classList.add('downloaded');
  const originalText = elements.downloadText.textContent;
  elements.downloadText.textContent = 'Baixado!';
  
  setTimeout(() => {
    elements.downloadButton.classList.remove('downloaded');
    elements.downloadText.textContent = originalText;
  }, 2000);
}

// Excel Import Functions
function downloadTemplate() {
  const templateData = [
    { title: 'EX01', url: 'https://exemplo.com/item1', addTitle: true },
    { title: 'EX02', url: 'https://exemplo.com/item2', addTitle: false },
    { title: 'EX03', url: 'https://exemplo.com/item3', addTitle: true }
  ];
  
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'QR Codes');
  
  XLSX.writeFile(wb, 'template_qrcode.xlsx');
}

function handleExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    importedData = jsonData.filter(row => {
      if (!row.title || !row.url) return false;
      const title = row.title.toString().trim();
      if (title.length > 5) return false;
      try {
        new URL(row.url.toString());
      } catch {
        return false;
      }
      return true;
    }).map(row => ({
      title: row.title.toString().trim(),
      url: row.url.toString(),
      addTitle: row.addTitle === true || row.addTitle === 'true' || row.addTitle === 1
    }));

    showImportPreview();
  };
  reader.readAsArrayBuffer(file);
}

function showImportPreview() {
  const previewDiv = document.getElementById('importPreview');
  const bulkDownloadBtn = document.getElementById('bulkDownload');

  if (importedData.length > 0) {
    previewDiv.innerHTML = importedData.map(item => `
      <div class="preview-item">
        <strong>${escapeHtml(item.title)}</strong>: ${escapeHtml(item.url)}
        <span class="preview-badge">${item.addTitle ? '(Com título)' : '(Sem título)'}</span>
      </div>
    `).join('');
    bulkDownloadBtn.classList.add('active');
  } else {
    previewDiv.innerHTML = `
      <div class="preview-item">
        Nenhum dado válido encontrado. Verifique se:
        <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: var(--font-size-xs);">
          <li>O arquivo tem as colunas: <strong>title</strong>, <strong>url</strong>, <strong>addTitle</strong></li>
          <li>Os títulos têm no máximo <strong>5 caracteres</strong></li>
          <li>As URLs são válidas e começam com http:// ou https://</li>
        </ul>
      </div>`;
    bulkDownloadBtn.classList.remove('active');
  }
}

async function bulkDownload() {
  if (importedData.length === 0) return;

  const button = document.getElementById('bulkDownload');
  const originalText = button.textContent;
  button.textContent = 'Gerando QR Codes...';
  button.disabled = true;

  try {
    const zip = new JSZip();
    const promises = [];

    for (let i = 0; i < importedData.length; i++) {
      const item = importedData[i];
      button.textContent = `Processando QR Code ${i + 1}/${importedData.length}...`;

      promises.push(new Promise((resolve) => {
        const tempDiv = document.createElement('div');
        tempDiv.className = 'title-in-qr-container';
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        if (item.addTitle) {
          const titleElement = document.createElement('div');
          titleElement.className = 'title-in-qr-text';
          titleElement.style.color = '#003366';
          titleElement.textContent = item.title.toUpperCase();
          tempDiv.appendChild(titleElement);
        }

        new QRCode(tempDiv, {
          text: item.url,
          width: 300,
          height: 300,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H,
          margin: 2
        });

        setTimeout(() => {
          html2canvas(tempDiv, {
            backgroundColor: '#ffffff'
          }).then(canvas => {
            canvas.toBlob(blob => {
              const fileName = `${item.title.replace(/[^a-z0-9]/gi, '_')}.png`;
              zip.file(fileName, blob);
              document.body.removeChild(tempDiv);
              resolve();
            }, 'image/png');
          });
        }, 200);
      }));
    }

    button.textContent = 'Compactando arquivos...';
    await Promise.all(promises);

    button.textContent = 'Preparando download...';
    const content = await zip.generateAsync({ type: "blob" });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "qrcodes.zip";
    link.click();
    URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error('Erro ao gerar QR codes:', error);
    alert('Ocorreu um erro ao gerar os QR codes. Por favor, tente novamente.');
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
}

// Modal Functions
function openEditModal(id) {
  const history = getStoredHistory();
  const item = history.find(h => h.id === id);
  if (!item) return;
  
  state.editingHistoryId = id;
  elements.nameInput.value = item.name;
  elements.modalOverlay.classList.remove('hidden');
  elements.nameInput.focus();
  elements.nameInput.select();
}

function closeEditModal() {
  elements.modalOverlay.classList.add('hidden');
  elements.nameInput.value = '';
  state.editingHistoryId = null;
}

function saveEditedName() {
  if (!state.editingHistoryId || !elements.nameInput.value.trim()) return;
  
  let history = getStoredHistory();
  const itemIndex = history.findIndex(item => item.id === state.editingHistoryId);
  
  if (itemIndex === -1) return;
  
  history[itemIndex].name = elements.nameInput.value.trim();
  setStoredHistory(history);
  renderHistory();
  closeEditModal();
}

function deleteHistoryItem(id) {
  if (!confirm('Tem certeza que deseja excluir este QR Code?')) return;
  
  let history = getStoredHistory();
  history = history.filter(item => item.id !== id);
  setStoredHistory(history);
  
  renderHistory();
}

function clearAllHistory() {
  if (!confirm('Tem certeza que deseja limpar todo o histórico?')) return;
  
  setStoredHistory([]);
  renderHistory();
}

// QR Code Viewer
function openQRCodeViewer(qrcodeData) {
  if (!qrcodeData || state.privacyMode) return;
  
  elements.qrcodeViewerImage.src = qrcodeData;
  elements.qrcodeViewerOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeQRCodeViewer() {
  elements.qrcodeViewerOverlay.classList.add('hidden');
  elements.qrcodeViewerImage.src = '';
  document.body.style.overflow = '';
}

// Privacy Mode
function togglePrivacyMode() {
  state.privacyMode = !state.privacyMode;
  
  const privacyIcon = document.getElementById('privacyIcon');
  const privacyIconSlash = document.getElementById('privacyIconSlash');
  
  if (privacyIcon && privacyIconSlash) {
    if (state.privacyMode) {
      privacyIcon.style.display = 'none';
      privacyIconSlash.style.display = 'block';
      elements.privacyToggle.setAttribute('title', 'Mostrar QR Codes');
    } else {
      privacyIcon.style.display = 'block';
      privacyIconSlash.style.display = 'none';
      elements.privacyToggle.setAttribute('title', 'Ocultar QR Codes');
    }
  }
  
  renderHistory();
}

// Accordion
function toggleAccordion(button) {
  const accordion = button.closest('.info-accordion, .options-accordion');
  if (!accordion) return;
  accordion.classList.toggle('active');
}

// WiFi Options Toggle
function initWifiOptions() {
  const wifiCustomType = document.getElementById('wifiCustomType');
  const titleOptions = document.getElementById('wifiTitleOptions');
  const logoOptions = document.getElementById('wifiLogoOptions');
  
  if (wifiCustomType && titleOptions && logoOptions) {
    wifiCustomType.addEventListener('change', () => {
      const value = wifiCustomType.value;
      if (value === 'title') {
        titleOptions.style.display = 'block';
        logoOptions.style.display = 'none';
      } else if (value === 'logo') {
        logoOptions.style.display = 'block';
        titleOptions.style.display = 'none';
      }
      saveFormData();
    });
  }
}

// Character Counter
function initCharCounter() {
  const titleInput = document.getElementById('titleInput');
  if (titleInput) {
    titleInput.addEventListener('input', function (e) {
      const count = e.target.value.length;
      const counter = document.getElementById('charCounter');
      if (counter) {
        counter.textContent = `${count}/5 caracteres`;
        counter.className = count > 5 ? 'char-counter error' : 'char-counter';
      }
    });
  }
}

// Initialize
// Reset Page Function
function resetPage() {
  if (confirm('Tem certeza que deseja descarregar todos os dados? Isso irá limpar todo o histórico e dados salvos, resetando a página para o estado padrão.')) {
    // Limpar todos os dados do localStorage
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    localStorage.removeItem(AUTO_SAVE_KEY);
    
    // Recarregar a página para resetar tudo
    window.location.reload();
  }
}

function addEventListeners() {
  elements.themeToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleThemeDropdown();
  });
  
  // Theme dropdown options
  document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      selectTheme(option.dataset.theme);
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-dropdown-wrapper')) {
      closeThemeDropdown();
    }
  });
  
  // Reset button
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', resetPage);
    }
  
  elements.generateButton.addEventListener('click', generateQRCode);
  elements.generateButtonTitle.addEventListener('click', generateQRCodeWithTitle);
  elements.generateButtonWifi.addEventListener('click', generateWiFiQRCode);
  
  elements.downloadButton.addEventListener('click', downloadMainQRCode);
  elements.clearButton.addEventListener('click', clearAllHistory);
  
  elements.modalClose.addEventListener('click', closeEditModal);
  elements.modalCancel.addEventListener('click', closeEditModal);
  elements.modalSave.addEventListener('click', saveEditedName);
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) closeEditModal();
  });
  elements.nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditedName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeEditModal();
    }
  });
  
  elements.logoUpload.addEventListener('change', handleLogoUpload);
  elements.removeLogoBtn.addEventListener('click', removeLogo);
  
  const wifiLogoUpload = document.getElementById('wifiLogoUpload');
  const removeWifiLogoBtn = document.getElementById('removeWifiLogoBtn');
  if (wifiLogoUpload) wifiLogoUpload.addEventListener('change', handleWifiLogoUpload);
  if (removeWifiLogoBtn) removeWifiLogoBtn.addEventListener('click', removeWifiLogo);
  
  if (elements.privacyToggle) {
    elements.privacyToggle.addEventListener('click', togglePrivacyMode);
  }
  
  if (elements.qrcodeViewerClose) {
    elements.qrcodeViewerClose.addEventListener('click', closeQRCodeViewer);
  }
  
  if (elements.qrcodeViewerOverlay) {
    elements.qrcodeViewerOverlay.addEventListener('click', (e) => {
      if (e.target === elements.qrcodeViewerOverlay || e.target === elements.qrcodeViewerClose) {
        closeQRCodeViewer();
      }
    });
  }
  
  if (elements.qrcodeCanvas) {
    elements.qrcodeCanvas.addEventListener('click', function() {
      if (state.currentQRCode && !state.privacyMode) {
        openQRCodeViewer(state.currentQRCode);
      }
    });
    elements.qrcodeCanvas.style.cursor = 'pointer';
  }
  
  document.querySelectorAll('.info-accordion-header').forEach(button => {
    button.addEventListener('click', () => toggleAccordion(button));
  });
  
  document.querySelectorAll('.options-accordion-header').forEach(button => {
    button.addEventListener('click', () => toggleAccordion(button));
  });
  
  // Excel import
  const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
  const excelFile = document.getElementById('excelFile');
  const bulkDownloadBtn = document.getElementById('bulkDownload');
  if (downloadTemplateBtn) downloadTemplateBtn.addEventListener('click', downloadTemplate);
  if (excelFile) excelFile.addEventListener('change', handleExcelImport);
  if (bulkDownloadBtn) bulkDownloadBtn.addEventListener('click', bulkDownload);
  
  // URL input enter key
  elements.urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      generateQRCode();
    }
  });
  
  const urlInputTitle = document.getElementById('urlInputTitle');
  if (urlInputTitle) {
    urlInputTitle.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        generateQRCodeWithTitle();
      }
    });
  }
}

function initialize() {
  initializeTheme();
  initTabs();
  initWifiOptions();
  initCharCounter();
  addEventListeners();
  setupAutoSave();
  loadFormData();
  renderHistory();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

