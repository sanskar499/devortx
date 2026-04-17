import L from 'leaflet';
import { state } from '../services/MockState.js';
import { FloodSim } from '../services/FloodSim.js';

let mapInstance = null;
let floodSim = null;
const markers = {};

export function initRiskMap(containerElem) {
  mapInstance = L.map(containerElem).setView([20, 0], 2);
  floodSim = new FloodSim(mapInstance);

  // Dark modern tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(mapInstance);

  state.subscribe(renderMarkers);

  // Simulation Trigger
  document.getElementById('run-sim-btn').addEventListener('click', () => {
    const approved = state.getApprovedReports();
    if (approved.length === 0) {
        window.showToast("Need at least one verified report to seed simulation.", "info");
        return;
    }
    window.showToast("Initializing Predictor Simulation...", "success");
    floodSim.start(approved.map(r => r.location));
  });

  // REAL-TIME GPS TRACKING:
  mapInstance.locate({ setView: false, watch: true, maxZoom: 16, enableHighAccuracy: false, timeout: 15000 });

  let userMarker = null;

  mapInstance.on('locationfound', (e) => {
    if (!userMarker) {
      const userIcon = L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: var(--accent-blue); width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 12px var(--accent-blue); border: 2px solid #fff;"></div>`
      });
      userMarker = L.marker(e.latlng, { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstance);
      userMarker.bindPopup("<b>You are here</b> (Live GPS)").openPopup();
      mapInstance.flyTo(e.latlng, 15);
    } else {
      userMarker.setLatLng(e.latlng);
    }
  });
}

let lastApprovedCount = 0;

function renderMarkers(currentState) {
  if (!mapInstance) return;

  const approvedList = currentState.getApprovedReports();
  
  // Logic to automatically trigger flood simulation on new approvals
  if (approvedList.length > lastApprovedCount) {
    const newReports = approvedList.slice(lastApprovedCount);
    floodSim.start(approvedList.map(r => r.location)); // Update simulation with all current risk zones
    lastApprovedCount = approvedList.length;
    
    // Optionally focus on the latest report
    const latest = approvedList[approvedList.length - 1];
    mapInstance.flyTo(latest.location, 14);
  }

  approvedList.forEach(report => {
    if (!markers[report.id]) {
      const { lat, lng } = report.location;
      
      const customIcon = L.divIcon({
        className: 'custom-icon',
        html: `<div class="marker-glowing ${report.aiAnalysis.confidence > 80 ? 'high-risk' : ''}" style="background-color: var(--verified-green); width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 10px var(--verified-green); border: 2px solid #fff;"></div>`
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);
      marker.bindPopup(`
        <div class="popup-content">
            <strong>Verified Record</strong><br>
            <small>${new Date(report.timestamp).toLocaleString()}</small>
            <p>${report.description}</p>
            <div class="ai-badge">${report.aiAnalysis.confidence.toFixed(1)}% AI Verification</div>
        </div>
      `);
      
      markers[report.id] = marker;
    }
  });
}
