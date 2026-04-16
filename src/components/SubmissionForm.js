import { state } from '../services/MockState.js';
import { runAITriage } from '../services/aiTriage.js';

export function setupSubmissionForm(container) {
  container.innerHTML = `
    <form id="submit-form">
      <div class="form-group">
        <label>Evidence (Photo/Voice)</label>
        <div class="media-upload" id="mock-upload">
          <span class="icon">📁</span> Click to browse or drop file here
        </div>
        <input type="file" id="file-input" class="hidden" accept="image/*, audio/*" />
      </div>
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

  const form = document.getElementById('submit-form');
  const uploadArea = document.getElementById('mock-upload');
  const fileInput = document.getElementById('file-input');
  const locInput = document.getElementById('loc-input');
  const gpsBtn = document.getElementById('gps-btn');
  const submitBtn = document.getElementById('submit-btn');

  let currentLocation = null;
  let hasFile = false;

  uploadArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if(e.target.files.length > 0) {
      uploadArea.innerHTML = `<span style="color:var(--verified-green)">✓ ${e.target.files[0].name} attached</span>`;
      uploadArea.style.borderColor = 'var(--verified-green)';
      hasFile = true;
      checkValidity();
    }
  });

  gpsBtn.addEventListener('click', () => {
    locInput.value = "Acquiring satellite lock...";
    
    if (!navigator.geolocation) {
      locInput.value = "Geolocation not supported";
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
        console.error("Error getting location: ", error);
        locInput.value = "Failed to access GPS. Please ensure permissions are granted.";
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

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
    submitBtn.textContent = 'AI Triaging Model...';
    submitBtn.disabled = true;

    const reportData = {
      description: document.getElementById('desc-input').value,
      location: currentLocation,
      hasMedia: hasFile
    };

    // Run AI Triage
    const aiResult = await runAITriage(reportData);
    
    reportData.aiAnalysis = aiResult;
    
    // Add to state
    state.addReport(reportData);
    
    window.showToast("Report submitted successfully. AI triaged and sent to moderator queue.", "success");
    
    // Reset
    form.reset();
    uploadArea.innerHTML = `<span class="icon">📁</span> Click to browse or drop file here`;
    uploadArea.style.borderColor = '';
    currentLocation = null;
    submitBtn.textContent = 'Submit to Network';
    submitBtn.disabled = true;
  });
}
