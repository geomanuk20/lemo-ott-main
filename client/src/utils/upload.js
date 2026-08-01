/**
 * Utility to upload files (images & videos) directly to Cloudinary via the backend api/upload endpoint.
 * Dynamically displays a glassmorphic upload progress indicator overlay on the screen during the upload.
 */
export const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    // 1. Create a beautiful glassmorphic dark-theme progress overlay in the DOM
    const overlay = document.createElement('div');
    overlay.id = 'fe-upload-progress-overlay';
    
    // Inline styling for professional, premium glassmorphism
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.webkitBackdropFilter = 'blur(8px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '999999';
    overlay.style.fontFamily = "'Inter', -apple-system, sans-serif";
    overlay.style.color = '#fff';

    const card = document.createElement('div');
    card.style.backgroundColor = '#121214';
    card.style.border = '1px solid rgba(255, 255, 255, 0.08)';
    card.style.borderRadius = '16px';
    card.style.padding = '35px 40px';
    card.style.width = '460px';
    card.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.8)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '18px';

    const title = document.createElement('div');
    title.innerText = 'UPLOADING ASSET';
    title.style.fontSize = '0.72rem';
    title.style.fontWeight = '900';
    title.style.color = '#b3d332';
    title.style.letterSpacing = '2.5px';

    const filename = document.createElement('div');
    filename.innerText = file.name;
    filename.style.fontSize = '0.95rem';
    filename.style.fontWeight = '600';
    filename.style.color = '#e2e8f0';
    filename.style.whiteSpace = 'nowrap';
    filename.style.overflow = 'hidden';
    filename.style.textOverflow = 'ellipsis';

    const progressContainer = document.createElement('div');
    progressContainer.style.display = 'flex';
    progressContainer.style.alignItems = 'center';
    progressContainer.style.gap = '15px';

    const progressBarBg = document.createElement('div');
    progressBarBg.style.flex = '1';
    progressBarBg.style.height = '8px';
    progressBarBg.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
    progressBarBg.style.borderRadius = '4px';
    progressBarBg.style.overflow = 'hidden';

    const progressBarFill = document.createElement('div');
    progressBarFill.style.width = '0%';
    progressBarFill.style.height = '100%';
    progressBarFill.style.backgroundColor = '#b3d332';
    progressBarFill.style.borderRadius = '4px';
    progressBarFill.style.transition = 'width 0.15s ease-out';
    progressBarFill.style.boxShadow = '0 0 12px rgba(179, 211, 50, 0.6)';

    progressBarBg.appendChild(progressBarFill);

    const progressText = document.createElement('span');
    progressText.innerText = '0%';
    progressText.style.fontSize = '0.88rem';
    progressText.style.fontWeight = '800';
    progressText.style.color = '#b3d332';
    progressText.style.width = '45px';
    progressText.style.textAlign = 'right';

    progressContainer.appendChild(progressBarBg);
    progressContainer.appendChild(progressText);

    const statusText = document.createElement('div');
    statusText.innerText = 'Initiating handshake...';
    statusText.style.fontSize = '0.8rem';
    statusText.style.color = '#888992';

    card.appendChild(title);
    card.appendChild(filename);
    card.appendChild(progressContainer);
    card.appendChild(statusText);
    overlay.appendChild(card);
    
    document.body.appendChild(overlay);

    // 2. Perform the upload via standard XMLHttpRequest
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', '/api/upload', true);

    let displayedPercent = 0;
    let trickleInterval = null;

    const updateProgressUI = (percent, status) => {
      progressBarFill.style.width = `${percent}%`;
      progressText.innerText = `${percent}%`;
      statusText.innerText = status;
    };

    // Dynamic progress event listener with trickle simulation
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        
        if (percent < 90) {
          displayedPercent = percent;
          updateProgressUI(displayedPercent, `Uploading file to server: ${displayedPercent}%`);
        } else if (percent >= 90 && !trickleInterval) {
          displayedPercent = 90;
          updateProgressUI(displayedPercent, 'Uploading to Cloud storage... Please wait.');
          
          // Trickle progress while backend is uploading file to Cloud/S3
          trickleInterval = setInterval(() => {
            if (displayedPercent < 98) {
              displayedPercent += 1;
              updateProgressUI(displayedPercent, `Syncing with cloud storage: ${displayedPercent}%`);
            }
          }, 450);
        }
      }
    };

    const cleanup = () => {
      if (trickleInterval) {
        clearInterval(trickleInterval);
      }
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    };

    xhr.onload = () => {
      cleanup();

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url || null);
        } catch (e) {
          reject(new Error('Invalid response payload from server'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.message || 'Upload request failed'));
        } catch (e) {
          reject(new Error(`Upload failed with status code: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error('Network connectivity issue during upload'));
    };

    xhr.onabort = () => {
      cleanup();
      reject(new Error('Upload task aborted'));
    };

    xhr.send(formData);
  });
};
