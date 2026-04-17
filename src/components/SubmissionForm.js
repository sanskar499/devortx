import Tesseract from 'tesseract.js';
import { state } from '../services/MockState.js';
import { runAITriage } from '../services/aiTriage.js';

export function setupSubmissionForm(container) {
  // ... (container.innerHTML remains largely the same)
  container.innerHTML = `
    <form id="submit-form">
      <div class="form-group">
        <label>Evidence (Photo/Voice)</label>
        <div class="media-upload" id="mock-upload">
          <span class="icon">📁</span> Click to browse or drop file here
        </div>
        <input type="file" id="file-input" class="hidden" accept="image/*" />
      </div>
      <!-- ... (rest of form) -->
      <div class="form-group">
        <label>Description of Incident</label>
        <textarea id="desc-input" class="form-control" placeholder="E.g. The main road is completely flooded, water is thigh-deep..." required></textarea>
      </div>
      <div class="form-group">
        <label>Location</label>
        <div style="display:flex; gap:1rem;">
          <input type="text" id="loc-input" class="form-control" placeholder="Fetching GPS..." readonly required>
          <button type="button" class="btn btn-primary" id="gps-btn">⌖ Locate</button>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%" id="submit-btn" disabled>
        Submit to Network
      </button>
    </form>
  `;

  // ... (event listeners)
  const form = document.getElementById('submit-form');
  const uploadArea = document.getElementById('mock-upload');
  const fileInput = document.getElementById('file-input');
  const locInput = document.getElementById('loc-input');
  const gpsBtn = document.getElementById('gps-btn');
  const submitBtn = document.getElementById('submit-btn');

  let currentLocation = null;
  let selectedFile = null;

  uploadArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if(e.target.files.length > 0) {
      selectedFile = e.target.files[0];
      uploadArea.innerHTML = `<span style="color:var(--verified-green)">✓ ${selectedFile.name} attached</span>`;
      uploadArea.style.borderColor = 'var(--verified-green)';
      checkValidity();
    }
  });

  gpsBtn.addEventListener('click', () => {
    locInput.value = "Acquiring satellite lock...";
    
    // Check for Secure Context (HTTPS requirement)
    if (!window.isSecureContext && location.hostname !== 'localhost') {
        window.showToast("GPS requires HTTPS. Using demo fallback location.", "info");
        setMockLocation();
        return;
    }

    if (!navigator.geolocation) {
      locInput.value = "GPS Not Supported. Using Mock.";
      setMockLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        currentLocation = { lat, lng };
        locInput.value = `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        checkValidity();
      },
      (error) => {
        console.warn("GPS Error:", error);
        window.showToast("GPS access denied or timed out. Using demo location.", "warning");
        setMockLocation();
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });

  function setMockLocation() {
    // Default mock location (Flood prone city center - Mumbai example)
    const mockLat = 19.0760 + (Math.random() * 0.01);
    const mockLng = 72.8777 + (Math.random() * 0.01);
    currentLocation = { lat: mockLat, lng: mockLng };
    locInput.value = `📍 ${mockLat.toFixed(4)}, ${mockLng.toFixed(4)} (Simulated)`;
    checkValidity();
  }

  function checkValidity() {
    if (currentLocation && document.getElementById('desc-input').value.length > 5) {
      submitBtn.disabled = false;
    } else {
      submitBtn.disabled = true;
    }
  }

  document.getElementById('desc-input').addEventListener('input', checkValidity);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;

    let ocrText = '';
    
    // OCR Extraction if image exists
    if (selectedFile) {
        submitBtn.textContent = 'OCR Engine: Reading Image...';
        try {
            const { data: { text } } = await Tesseract.recognize(selectedFile, 'eng');
            ocrText = text;
        } catch (err) {
            console.error("OCR Failed:", err);
        }
    }

    submitBtn.textContent = 'AI Multi-modal Triage...';

    const reportData = {
      description: document.getElementById('desc-input').value,
      location: currentLocation,
      hasMedia: !!selectedFile,
      ocrText: ocrText
    };

    // Run AI Triage
    const aiResult = await runAITriage(reportData);
    reportData.aiAnalysis = aiResult;
    
    // Add to state
    state.addReport(reportData);
    
    window.showToast("Report submitted successfully. AI triaged with OCR verification.", "success");
    
    // Reset
    form.reset();
    uploadArea.innerHTML = `<span class="icon">📁</span> Click to browse or drop file here`;
    uploadArea.style.borderColor = '';
    selectedFile = null;
    currentLocation = null;
    submitBtn.textContent = 'Submit to Network';
    submitBtn.disabled = true;
  });
}
