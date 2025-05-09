document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const urlInput = document.getElementById('url');
    const titleInput = document.getElementById('title');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const shareBtn = document.getElementById('share-btn');
    const historyBtn = document.getElementById('history-btn');
    const clearHistoryBtn = document.getElementById('clear-history');
    const qrCodeImg = document.getElementById('qr-code');
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    const closeModalBtn = document.querySelector('.close-btn');
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    
    // Inicializar
    initializeApp();
    
    // Event listeners
    generateBtn.addEventListener('click', generateQRCode);
    downloadBtn.addEventListener('click', downloadQRCode);
    shareBtn.addEventListener('click', shareQRCode);
    historyBtn.addEventListener('click', openHistoryModal);
    closeModalBtn.addEventListener('click', closeHistoryModal);
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    // Fechar modal ao clicar fora dele
    window.addEventListener('click', function(event) {
        if (event.target === historyModal) {
            closeHistoryModal();
        }
    });
    
    /**
     * Inicializa a aplicação
     */
    function initializeApp() {
        // Definir estado inicial dos botões
        downloadBtn.disabled = true;
        shareBtn.disabled = true;
    }
    
    /**
     * Gera o QR code com base nos dados de entrada
     */
    function generateQRCode() {
        const url = urlInput.value.trim();
        const title = titleInput.value.trim() || url;
        
        if (!url) {
            alert('Por favor, informe uma URL ou texto para gerar o QR code.');
            return;
        }
        
        // Gerar QR code
        qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
        
        // Salvar no histórico
        saveToHistory(url, title);
        
        // Habilitar botões
        downloadBtn.disabled = false;
        shareBtn.disabled = false;
    }
    
    /**
     * Salva o QR code no histórico (localStorage)
     */
    function saveToHistory(url, title) {
        // Obter histórico existente
        let history = getHistory();
        
        // Adicionar novo item no início
        const newItem = {
            url: url,
            title: title,
            date: new Date().toISOString()
        };
        
        // Remover item duplicado se existir
        history = history.filter(item => item.url !== url);
        
        // Adicionar no início
        history.unshift(newItem);
        
        // Limitar a 10 itens
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        
        // Salvar em localStorage
        localStorage.setItem('qrCodeHistory', JSON.stringify(history));
    }
    
    /**
     * Obtém o histórico de QR codes
     */
    function getHistory() {
        const historySaved = localStorage.getItem('qrCodeHistory');
        return historySaved ? JSON.parse(historySaved) : [];
    }
    
    /**
     * Faz o download do QR code como imagem PNG
     */
    function downloadQRCode() {
        const url = urlInput.value.trim();
        const title = titleInput.value.trim() || url;
        if (!url) return;
        
        // Nome do arquivo
        const fileName = `qr-${title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}.png`;
        
        // Limpar o canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Carregar a imagem do QR code
        const qrImage = new Image();
        qrImage.crossOrigin = 'Anonymous';
        qrImage.onload = function() {
            // Desenhar o QR code no canvas
            ctx.drawImage(qrImage, 0, 0, canvas.width, canvas.height);
            
            // Converter o canvas para PNG
            const dataUrl = canvas.toDataURL('image/png');
            
            // Criar link para download
            const downloadLink = document.createElement('a');
            downloadLink.href = dataUrl;
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };
        qrImage.src = qrCodeImg.src;
    }
    
    /**
     * Compartilha o QR code usando a Web Share API
     */
    function shareQRCode() {
        const url = urlInput.value.trim();
        const title = titleInput.value.trim() || url;
        
        if (!url) {
            alert('Por favor, informe uma URL ou texto para compartilhar.');
            return;
        }
        
        if (!navigator.share) {
            alert('Compartilhamento não disponível no seu navegador.');
            return;
        }
        
        // Criar uma imagem do QR code para compartilhar
        const qrImage = new Image();
        qrImage.crossOrigin = 'Anonymous';
        qrImage.src = qrCodeImg.src;
        
        qrImage.onload = function() {
            // Limpar o canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Desenhar QR code
            ctx.drawImage(qrImage, 0, 0, canvas.width, canvas.height);
            
            compartilharImagem();
        };
        
        async function compartilharImagem() {
            try {
                // Converter o canvas para um blob
                canvas.toBlob(async function(blob) {
                    const file = new File([blob], `qr-${title}.png`, { type: 'image/png' });
                    
                    // Compartilhar usando a Web Share API
                    await navigator.share({
                        files: [file],
                        title: 'QR Code Compartilhado',
                        text: `QR Code para: ${title}`
                    });
                }, 'image/png');
            } catch (error) {
                console.error('Erro ao compartilhar:', error);
                
                // Tentar compartilhar apenas o texto se o compartilhamento da imagem falhar
                try {
                    await navigator.share({
                        title: 'QR Code Compartilhado',
                        text: `QR Code para: ${title}`,
                        url: url
                    });
                } catch (err) {
                    alert('Não foi possível compartilhar o QR code.');
                }
            }
        }
    }
    
    /**
     * Abre o modal do histórico
     */
    function openHistoryModal() {
        renderHistoryList();
        historyModal.style.display = 'flex';
    }
    
    /**
     * Fecha o modal do histórico
     */
    function closeHistoryModal() {
        historyModal.style.display = 'none';
    }
    
    /**
     * Renderiza a lista de histórico
     */
    function renderHistoryList() {
        const history = getHistory();
        
        // Limpar lista
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<div class="no-history">Nenhum QR code gerado ainda.</div>';
            return;
        }
        
        // Adicionar cada item ao histórico
        history.forEach((item) => {
            const formattedDate = new Date(item.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-info">
                    <div class="history-title">${item.title || 'Sem título'}</div>
                    <div class="history-url">${item.url}</div>
                    <div class="history-date">${formattedDate}</div>
                </div>
                <div class="history-actions">
                    <button class="history-btn restore-btn">Carregar</button>
                </div>
            `;
            
            // Adicionar evento para o botão de restaurar
            const restoreBtn = historyItem.querySelector('.restore-btn');
            restoreBtn.addEventListener('click', () => {
                restoreFromHistory(item);
                closeHistoryModal();
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    /**
     * Restaura um QR code do histórico
     */
    function restoreFromHistory(item) {
        urlInput.value = item.url;
        titleInput.value = item.title || '';
        
        // Gerar QR code novamente
        generateQRCode();
    }
    
    /**
     * Limpa todo o histórico
     */
    function clearHistory() {
        if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
            localStorage.removeItem('qrCodeHistory');
            renderHistoryList();
        }
    }
});