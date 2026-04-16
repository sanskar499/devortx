import L from 'leaflet';
import { state } from '../services/MockState.js';

let mapInstance = null;
const markers = {};

export function initRiskMap(containerElem) {
  // Center roughly on a typical vulnerable city area (e.g., Jakarta roughly or just a generic bounds)
  // Let's use a generic point, say somewhere in Florida or just London
  mapInstance = L.map(containerElem).setView([51.505, -0.09], 13);

  // Dark modern tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(mapInstance);

  // Add mock initial layers (Inundation zones)
  const inundationStyle = { color: '#06b6d4', weight: 2, fillOpacity: 0.2 };
  L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
  ], inundationStyle).addTo(mapInstance).bindPopup("<b>High Risk Inundation Zone</b><br>AI Prediction: 89% confidence.");

  // Listen to state changes to add approved reports
  state.subscribe(renderMarkers);
}

function renderMarkers(currentState) {
  if (!mapInstance) return;

  const approvedList = currentState.getApprovedReports();
  
  approvedList.forEach(report => {
    if (!markers[report.id]) {
      // Create new marker
      const { lat, lng } = report.location;
      
      const customIcon = L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: var(--verified-green); width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 10px var(--verified-green); border: 2px solid #fff;"></div>`
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);
      marker.bindPopup(`
        <strong>Verified Report</strong><br>
        <small>${new Date(report.timestamp).toLocaleString()}</small><br>
        <p>"${report.description}"</p>
      `);
      
      markers[report.id] = marker;
    }
  });
}
