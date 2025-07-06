const urlInput = document.getElementById('videoUrl');
const downloadButton = document.getElementById('downloadButton');
// const loadingSpinner = document.getElementById('loadingSpinner');
const resultSection = document.getElementById('resultSection');
const downloadLink = document.getElementById('result');
const copyButton = document.getElementById('copyButton');
const downloadNowButton = document.getElementById('downloadNowButton');
const downloadAnotherButton = document.getElementById('downloadAnotherButton');
const toastContainer = document.getElementById('toastContainer');

const showToast = (title, description, variant = 'default') => {
  const toast = document.createElement('div');
  toast.className = `p-4 rounded-lg shadow-lg max-w-sm ${
    variant === 'destructive' ? 'bg-white text-destructive-foreground' : 'bg-green-500 text-white'
  } animate-fade-in`;
  toast.innerHTML = `
    <div class="flex items-start space-x-2">
      <svg class="w-5 h-5 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2">
        ${
          variant === 'destructive'
            ? '<path d="M12 2v20m10-10H2"></path>'
            : '<polyline points="20 6 9 17 4 12"></polyline>'
        }
      </svg>
      <div>
        <h4 class="font-semibold">${title}</h4>
        <p class="text-sm">${description}</p>
      </div>
    </div>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

const handleDownload = () => {
  const url = urlInput.value.trim();
  
  if (!url) {
    showToast('Please enter a URL', 'Paste a video URL to get started', 'destructive');
    return;
  }

  downloadButton.disabled = true;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  fetch(`https://videominiapp.onrender.com/api/download`, {  // Update if needed
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    signal: controller.signal
  })
    .then(res => res.json())
    .then(data => {
      if (data.downloadUrl) {
        downloadLink.innerHTML = `<a href="${data.downloadUrl}" target="_blank" rel="noopener noreferrer">Download Link</a>`;
        resultSection.classList.remove('hidden');
        showToast('Success!', 'Your download link is ready');
      } else {
        showToast('Error', 'No download URL returned', 'destructive');
      }
    })
    .catch(err => {
      if (err.name === 'AbortError') {
        showToast('Timeout', 'Server took too long to respond', 'destructive');
      } else {
        showToast('Server Error', 'Could not fetch download link', 'destructive');
      }
    })
    .finally(() => {
      clearTimeout(timeoutId);
      downloadButton.disabled = false;
      // loadingSpinner.classList.add('hidden');
    });
};

downloadButton.addEventListener('click', handleDownload);
urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleDownload(); });

copyButton.addEventListener('click', async () => {
  try {
    const anchor = downloadLink.querySelector('a');
    if (anchor) {
      await navigator.clipboard.writeText(anchor.href);
      showToast('Copied!', 'Download link copied to clipboard');
    } else {
      throw new Error('No link found');
    }
  } catch {
    showToast('Failed to copy', 'Please copy the link manually', 'destructive');
  }
});

downloadNowButton.addEventListener('click', () => {
  try {
    const anchor = downloadLink.querySelector('a');
    if (!anchor) throw new Error('No link found');
    window.open(anchor.href, '_blank');
  } catch {
    showToast('Failed to open', 'Please open the link manually', 'destructive');
  }
});

downloadAnotherButton.addEventListener('click', () => {
  urlInput.value = '';
  downloadLink.textContent = '';
  resultSection.classList.add('hidden');
  showToast('Ready!', 'Paste another video URL');
});
