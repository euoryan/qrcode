const HISTORY_STORAGE_KEY = 'qrcode_history';
const THEME_STORAGE_KEY = 'theme_preference';
const MAX_HISTORY_ITEMS = 20;

const elements = {
  themeToggle: document.getElementById('themeToggle'),
  urlInput: document.getElementById('urlInput'),
  nameInputField: document.getElementById('nameInputField'),
  logoUpload: document.getElementById('logoUpload'),
  logoFileLabel: document.getElementById('logoFileLabel'),
  removeLogoBtn: document.getElementById('removeLogoBtn'),
  generateButton: document.getElementById('generateButton'),
  resultSection: document.getElementById('resultSection'),
  qrcodeCanvas: document.getElementById('qrcodeCanvas'),
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
  currentQRCode: null,
  currentQRCodeSVG: null,
  editingHistoryId: null,
  privacyMode: false
};

function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
}

function setStoredTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  setStoredTheme(theme);
  updateThemeToggleLabel(theme);
}

function updateThemeToggleLabel(theme) {
  const label = document.getElementById('themeToggleLabel');
  if (label) {
    label.textContent = theme === 'dark' ? 'Dark mode' : 'Light mode';
  }
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

function initializeTheme() {
  const savedTheme = getStoredTheme();
  setTheme(savedTheme);
  updateThemeToggleLabel(savedTheme);
}

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

function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.type !== 'image/png') {
    alert('Por favor, selecione apenas arquivos PNG.');
    return;
  }
  
  if (file.size > 500000) { // 500KB
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
}

async function addLogoToCanvas(canvas, ctx) {
  return new Promise((resolve) => {
    if (!state.currentLogo) {
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
    logoImg.src = state.currentLogo;
  });
}

async function generateQRCode() {
  const url = elements.urlInput.value.trim();
  
  if (!url) {
    elements.urlInput.classList.add('input-error');
    elements.urlInput.focus();
    return;
  }
  
  // Validar URL
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
    
    if (typeof QRCode === 'undefined') {
      throw new Error('Biblioteca QRCode não carregada. Por favor, recarregue a página.');
    }
    
    const qrContainer = document.createElement('div');
    qrContainer.style.position = 'absolute';
    qrContainer.style.left = '-9999px';
    qrContainer.style.top = '-9999px';
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
      await addLogoToCanvas(canvas, ctx);
    }
    
    state.currentQRCode = canvas.toDataURL('image/png');
    addToHistory(finalUrl, state.currentQRCode);
    elements.resultSection.classList.add('show');
    
  } catch (error) {
    alert('Erro ao gerar QR Code. Por favor, tente novamente.');
  } finally {
    elements.generateButton.classList.remove('loading');
    elements.generateButton.disabled = false;
  }
}

function addToHistory(url, qrcodeData) {
  const history = getStoredHistory();
  
  let name = `QR Code ${history.length + 1}`;
  if (elements.nameInputField) {
    const customName = elements.nameInputField.value.trim();
    if (customName) {
      name = customName;
    }
  }
  
  const historyItem = {
    id: generateId(),
    name: name,
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
  
  if (elements.nameInputField) {
    elements.nameInputField.value = '';
    const nextDefaultName = `QR Code ${history.length + 1}`;
    elements.nameInputField.placeholder = nextDefaultName;
  }
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

async function downloadQRCode(qrcodeData, name, format = 'png') {
  try {
    const link = document.createElement('a');
    
    if (format === 'svg') {
      const svgData = await generateQRCodeSVG(qrcodeData);
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

async function generateQRCodeSVG(pngData) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="300">
    <image x="0" y="0" width="300" height="300" xlink:href="${pngData}"/>
  </svg>`;
}

async function downloadMainQRCode() {
  if (!state.currentQRCode) return;
  
  let name = 'qrcode';
  if (elements.nameInputField && elements.nameInputField.value.trim()) {
    name = elements.nameInputField.value.trim();
  } else {
    const history = getStoredHistory();
    name = `QR Code ${history.length + 1}`;
  }
  
  const format = elements.downloadFormat ? elements.downloadFormat.value : 'png';
  await downloadQRCode(state.currentQRCode, name, format);
  
  elements.downloadButton.classList.add('downloaded');
  const originalText = elements.downloadText.textContent;
  elements.downloadText.textContent = 'Baixado!';
  
  setTimeout(() => {
    elements.downloadButton.classList.remove('downloaded');
    elements.downloadText.textContent = originalText;
  }, 2000);
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

function handleModalKeyPress(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveEditedName();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeEditModal();
  }
}

function handleModalOverlayClick(e) {
  if (e.target === elements.modalOverlay) {
    closeEditModal();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Visualização ampliada do QR Code
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

function handleQRCodeViewerClick(e) {
  if (e.target === elements.qrcodeViewerOverlay || e.target === elements.qrcodeViewerClose) {
    closeQRCodeViewer();
  }
}

function togglePrivacyMode() {
  state.privacyMode = !state.privacyMode;
  
  if (elements.privacyIcon) {
    if (state.privacyMode) {
      elements.privacyIcon.setAttribute('viewBox', '0 0 16 16');
      elements.privacyIcon.innerHTML = '<path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/><path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/><path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>';
      elements.privacyToggle.setAttribute('title', 'Mostrar QR Codes');
    } else {
      elements.privacyIcon.setAttribute('viewBox', '0 0 16 16');
      elements.privacyIcon.innerHTML = '<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>';
      elements.privacyToggle.setAttribute('title', 'Ocultar QR Codes');
    }
  }
  
  if (elements.resultSection && elements.resultSection.classList.contains('show')) {
    const qrcodeContainer = elements.resultSection.querySelector('.result-qrcode-container');
    if (qrcodeContainer) {
      if (state.privacyMode) {
        qrcodeContainer.style.display = 'none';
      } else {
        qrcodeContainer.style.display = 'flex';
      }
    }
  }
  
  if (elements.qrcodeViewerOverlay && !elements.qrcodeViewerOverlay.classList.contains('hidden')) {
    closeQRCodeViewer();
  }
  
  renderHistory();
}

function toggleAccordion(button) {
  const accordion = button.closest('.info-accordion, .options-accordion');
  if (!accordion) return;
  
  const isActive = accordion.classList.contains('active');
  
  const accordionType = accordion.classList.contains('info-accordion') ? '.info-accordion' : '.options-accordion';
  document.querySelectorAll(accordionType).forEach(acc => {
    acc.classList.remove('active');
  });
  
  if (!isActive) {
    accordion.classList.add('active');
  }
}

function addEventListeners() {
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  elements.urlInput.addEventListener('input', function() {
    this.classList.remove('input-error');
  });
  
  elements.urlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      generateQRCode();
    }
  });
  
  elements.generateButton.addEventListener('click', generateQRCode);
  
  elements.downloadButton.addEventListener('click', downloadMainQRCode);
  
  elements.clearButton.addEventListener('click', clearAllHistory);
  
  elements.modalClose.addEventListener('click', closeEditModal);
  elements.modalCancel.addEventListener('click', closeEditModal);
  elements.modalSave.addEventListener('click', saveEditedName);
  elements.modalOverlay.addEventListener('click', handleModalOverlayClick);
  elements.nameInput.addEventListener('keypress', handleModalKeyPress);
  
  elements.logoUpload.addEventListener('change', handleLogoUpload);
  elements.removeLogoBtn.addEventListener('click', removeLogo);
  
  if (elements.privacyToggle) {
    elements.privacyToggle.addEventListener('click', togglePrivacyMode);
  }
  
  if (elements.qrcodeViewerClose) {
    elements.qrcodeViewerClose.addEventListener('click', closeQRCodeViewer);
  }
  
  if (elements.qrcodeViewerOverlay) {
    elements.qrcodeViewerOverlay.addEventListener('click', handleQRCodeViewerClick);
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
  
  if (elements.nameInputField) {
    const history = getStoredHistory();
    const defaultName = `QR Code ${history.length + 1}`;
    elements.nameInputField.placeholder = defaultName;
  }
}

function initialize() {
  initializeTheme();
  addEventListeners();
  renderHistory();
  elements.urlInput.focus();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

