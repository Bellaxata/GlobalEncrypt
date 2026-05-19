let currentFileContent = null;
let currentFileName = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const encryptBtn = document.getElementById('encryptBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const outputCode = document.getElementById('outputCode');
const hashInfo = document.getElementById('hashInfo');
const expiryInfo = document.getElementById('expiryInfo');
const statsInfo = document.getElementById('statsInfo');
const expirySlider = document.getElementById('expirySlider');
const expiryValue = document.getElementById('expiryValue');
const expiryDatePreview = document.getElementById('expiryDatePreview');

// Get selected obfuscation type
function getObfuscationType() {
  const selected = document.querySelector('input[name="obfType"]:checked');
  return selected ? selected.value : 'max';
}

// Update expiry preview
function updateExpiryPreview() {
  const days = parseInt(expirySlider.value);
  expiryValue.textContent = days;
  const expiryDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
  expiryDatePreview.textContent = `(expires: ${expiryDate.toLocaleDateString()})`;
}

expirySlider.addEventListener('input', updateExpiryPreview);
updateExpiryPreview();

// Preset buttons
document.querySelectorAll('.preset').forEach(btn => {
  btn.addEventListener('click', () => {
    const days = btn.getAttribute('data-days');
    expirySlider.value = days;
    updateExpiryPreview();
  });
});

// File upload handlers
browseBtn.addEventListener('click', () => {
  fileInput.click();
});

uploadArea.addEventListener('click', (e) => {
  if (e.target !== browseBtn && !fileInput.contains(e.target)) {
    fileInput.click();
  }
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

function handleFile(file) {
  if (!file.name.match(/\.(js|mjs|txt)$/i)) {
    alert('Please upload a .js, .mjs, or .txt file');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File too large! Maximum 5MB');
    return;
  }
  
  currentFileName = file.name;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    currentFileContent = e.target.result;
    
    fileName.textContent = file.name;
    fileSize.textContent = `(${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.style.display = 'flex';
    uploadArea.style.display = 'none';
    encryptBtn.disabled = false;
    
    outputCode.textContent = 'Ready to encrypt...';
    hashInfo.innerHTML = '';
    expiryInfo.innerHTML = '';
    statsInfo.innerHTML = '';
  };
  reader.readAsText(file);
}

removeFileBtn.addEventListener('click', () => {
  currentFileContent = null;
  currentFileName = null;
  fileInfo.style.display = 'none';
  uploadArea.style.display = 'block';
  encryptBtn.disabled = true;
  outputCode.textContent = 'Waiting for file upload...';
  hashInfo.innerHTML = '';
  expiryInfo.innerHTML = '';
  statsInfo.innerHTML = '';
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
});

// Encrypt function
encryptBtn.addEventListener('click', async () => {
  if (!currentFileContent) {
    alert('Please upload a file first');
    return;
  }
  
  const days = parseInt(expirySlider.value);
  const obfType = getObfuscationType();
  
  encryptBtn.classList.add('loading');
  encryptBtn.disabled = true;
  encryptBtn.innerHTML = '<span class="btn-icon">⏳</span> ENCRYPTING WITH HASH...';
  outputCode.textContent = '🔮 Applying ultra-hard obfuscation with security hash...\n⏱️ This may take 10-30 seconds...';
  
  try {
    const response = await fetch('/api/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: currentFileContent,
        expiryDays: days,
        obfuscationType: obfType
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      outputCode.textContent = data.obfuscated;
      
      hashInfo.innerHTML = `
        🔐 SECURITY HASH: ${data.hash}
        <br>🛡️ If hash doesn't match, code will NOT execute
      `;
      
      const expiryDate = new Date(data.expiry);
      expiryInfo.innerHTML = `
        ⏰ TIMEBOMB: License expires on ${expiryDate.toLocaleString()}
        <br>📞 Contact: <a href="${data.contact}" target="_blank" style="color:#ff3366">@Xatanicvxii on Telegram</a>
        <br>⚠️ After expiry, code will throw error
      `;
      
      statsInfo.innerHTML = `
        📊 Original: ${data.stats.originalSize} bytes | 
        Encrypted: ${data.stats.obfuscatedSize} bytes | 
        Ratio: ${data.stats.ratio}
        <br>🔒 Type: ${obfType.toUpperCase()} | Hash: ${data.stats.hash}
      `;
      
      copyBtn.disabled = false;
      downloadBtn.disabled = false;
      
      encryptBtn.innerHTML = '<span class="btn-icon">✅</span> ENCRYPTED!';
      setTimeout(() => {
        encryptBtn.innerHTML = '<span class="btn-icon">🔮</span> ENCRYPT & PROTECT';
      }, 2000);
    } else {
      outputCode.textContent = `❌ Error: ${data.error}`;
      expiryInfo.innerHTML = `Contact ${data.contact} for support`;
    }
    
  } catch (error) {
    outputCode.textContent = `❌ Network error: ${error.message}\n\nPlease make sure the server is running.`;
  } finally {
    encryptBtn.classList.remove('loading');
    encryptBtn.disabled = false;
  }
});

// Copy output
copyBtn.addEventListener('click', async () => {
  const text = outputCode.textContent;
  if (text && !text.includes('Waiting') && !text.includes('Encrypting') && !text.includes('Error')) {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = '✓ Copied!';
    setTimeout(() => {
      copyBtn.textContent = '📋 Copy';
    }, 1500);
  }
});

// Download output
downloadBtn.addEventListener('click', () => {
  const text = outputCode.textContent;
  if (text && !text.includes('Waiting') && !text.includes('Encrypting') && !text.includes('Error')) {
    const blob = new Blob([text], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const originalName = currentFileName ? currentFileName.replace(/\.(js|mjs|txt)$/i, '') : 'protected';
    const type = getObfuscationType();
    a.href = url;
    a.download = `${originalName}_${type}_encrypted_${expirySlider.value}d.js`;
    a.click();
    URL.revokeObjectURL(url);
    downloadBtn.textContent = '✓ Downloaded!';
    setTimeout(() => {
      downloadBtn.textContent = '💾 Download';
    }, 1500);
  }
});