class DocumentRenamerApp {
    constructor() {
        this.files = [];
        this.processingQueue = [];
        this.currentBatch = 0;
        this.totalBatches = 0;
        this.isProcessing = false;
        this.previewFile = null;
        this.previewNewName = null;
        this.zoomLevel = 100;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const uploadZone = document.querySelector('.upload-zone');
        const fileInput = document.getElementById('fileInput');
        const processBtn = document.getElementById('processBtn');
        const downloadAllBtn = document.getElementById('downloadAllBtn');

        // Modern event listeners
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadZone.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        processBtn.addEventListener('click', this.startProcessing.bind(this));
        downloadAllBtn.addEventListener('click', this.downloadAllFiles.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        document.querySelector('.upload-zone').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.querySelector('.upload-zone').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.querySelector('.upload-zone').classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.addFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.addFiles(files);
    }

    addFiles(newFiles) {
        const validFiles = newFiles.filter(file => {
            const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                              'text/plain', 'application/msword', 'application/rtf'];
            return validTypes.includes(file.type) || file.name.match(/\.(pdf|docx|txt|doc|rtf|odt)$/i);
        });

        this.files = [...this.files, ...validFiles];
        this.updateUI();
    }

    updateUI() {
        const filesSection = document.getElementById('filesSection');
        const filesList = document.getElementById('filesGrid');
        const processBtn = document.getElementById('processBtn');
        const fileCount = document.getElementById('fileCount');

        if (this.files.length > 0) {
            filesSection.style.display = 'block';
            fileCount.textContent = `${this.files.length} file${this.files.length > 1 ? 's' : ''}`;
            
            filesList.innerHTML = this.files.map((file, index) => `
                <div class="file-item fade-in">
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                    </div>
                    <button class="remove-btn" onclick="app.removeFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            
            processBtn.disabled = false;
            this.updateBatchInfo();
        } else {
            filesSection.style.display = 'none';
            processBtn.disabled = true;
        }
    }

    updateBatchInfo() {
        this.totalBatches = Math.ceil(this.files.length / 10);
        const batchText = document.getElementById('batchText');
        const batchFill = document.getElementById('batchFill');
        
        const progress = this.totalBatches > 0 ? (this.currentBatch / this.totalBatches) * 100 : 0;
        
        batchText.textContent = `${this.currentBatch}/${this.totalBatches}`;
        batchFill.style.setProperty('--progress', `${progress * 3.6}deg`);
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateUI();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async startProcessing() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.currentBatch = 0;
        this.processingQueue = [...this.files];
        
        // Hide files panel and show results panel
        document.getElementById('filesSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        
        const processBtn = document.getElementById('processBtn');
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        document.getElementById('resultsGrid').innerHTML = '';
        
        while (this.processingQueue.length > 0) {
            const batch = this.processingQueue.splice(0, 10);
            await this.processBatch(batch);
            this.currentBatch++;
            this.updateBatchInfo();
        }
        
        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fas fa-play"></i> Process Files';
        this.isProcessing = false;
        
        if (document.getElementById('autoDownload').checked) {
            this.downloadAllFiles();
        }
    }

    async processBatch(batch) {
        const resultsList = document.getElementById('resultsGrid');
        
        for (let i = 0; i < batch.length; i++) {
            const file = batch[i];
            const resultItem = this.createResultItem(file, i);
            resultsList.appendChild(resultItem);
            
            try {
                const newName = await this.analyzeDocument(file);
                this.updateResultItem(resultItem, file, newName, 'completed');
                
                if (document.getElementById('autoDownload').checked) {
                    this.downloadFile(file, newName);
                }
            } catch (error) {
                this.updateResultItem(resultItem, file, null, 'error', error.message);
            }
        }
    }

    createResultItem(file, index) {
        const item = document.createElement('div');
        item.className = 'result-item fade-in';
        item.innerHTML = `
            <div class="result-info">
                <div class="result-name">${file.name}</div>
                <div class="result-status">
                    <i class="fas fa-circle-notch fa-spin"></i> Processing...
                </div>
            </div>
            <div class="result-actions">
                <button class="btn-secondary" onclick="app.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        return item;
    }

    updateResultItem(item, originalFile, newName, status, error = null) {
        const resultInfo = item.querySelector('.result-info');
        const resultActions = item.querySelector('.result-actions');
        
        if (status === 'completed') {
            resultInfo.innerHTML = `
                <div class="result-name">${newName}</div>
                <div class="result-status">
                    <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                    <span>Ready</span>
                </div>
            `;
            
            // Create buttons with proper file object reference
            const eyeBtn = document.createElement('button');
            eyeBtn.className = 'btn-secondary';
            eyeBtn.innerHTML = '<i class="fas fa-eye"></i>';
            eyeBtn.onclick = () => this.previewDocument(originalFile, newName);
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn-primary';
            downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
            downloadBtn.onclick = () => this.downloadFile(originalFile, newName);
            
            resultActions.innerHTML = '';
            resultActions.appendChild(eyeBtn);
            resultActions.appendChild(downloadBtn);
        } else if (status === 'error') {
            resultInfo.innerHTML = `
                <div class="result-name">${originalFile.name}</div>
                <div class="result-status" style="color: var(--error-color);">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>${error}</span>
                </div>
            `;
        }
    }

    async analyzeDocument(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:3000/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.newName;
        } catch (error) {
            console.error('Error analyzing document:', error);
            throw error;
        }
    }

    downloadFile(originalFile, newName) {
        const blob = new Blob([originalFile], { type: originalFile.type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = newName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up after a short delay
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    downloadAllFiles() {
        const resultItems = document.querySelectorAll('.result-item');
        resultItems.forEach(item => {
            const downloadBtn = item.querySelector('.btn-primary');
            if (downloadBtn && !downloadBtn.disabled) {
                downloadBtn.click();
            }
        });
    }

    previewDocument(originalFile, newName) {
        this.previewFile = originalFile;
        this.previewNewName = newName;
        this.zoomLevel = 100;
        
        document.getElementById('previewOriginalName').textContent = originalFile.name;
        document.getElementById('previewNewName').textContent = newName;
        
        const fileURL = URL.createObjectURL(originalFile);
        document.getElementById('pdfPreview').src = fileURL;
        
        document.getElementById('previewModal').style.display = 'flex';
    }

    closePreview() {
        document.getElementById('previewModal').style.display = 'none';
        
        const iframe = document.getElementById('pdfPreview');
        if (iframe.src) {
            URL.revokeObjectURL(iframe.src);
            iframe.src = '';
        }
    }

    downloadPreviewFile() {
        if (this.previewFile && this.previewNewName) {
            this.downloadFile(this.previewFile, this.previewNewName);
            this.closePreview();
        }
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 25, 200);
        this.updateZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 25, 50);
        this.updateZoom();
    }

    updateZoom() {
        document.querySelector('.zoom-level').textContent = `${this.zoomLevel}%`;
    }

    handleEscapeKey(e) {
        if (e.key === 'Escape') {
            this.closePreview();
        }
    }
}

// Initialize the app
const app = new DocumentRenamerApp();
document.addEventListener('keydown', (e) => app.handleEscapeKey(e));
