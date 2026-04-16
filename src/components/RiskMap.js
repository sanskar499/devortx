import L from 'leaflet';
import { state } from '../services/MockState.js';

let mapInstance = null;
const markers = {};

export function initRiskMap(containerElem) {
  // Start with a global view so the user isn't locked to London while waiting for GPS 
  mapInstance = L.map(containerElem).setView([20, 0], 2);

  // Dark modern tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(mapInstance);

  // Listen to state changes to add approved reports
  state.subscribe(renderMarkers);

  // REAL-TIME GPS TRACKING:
  // Ask for location and continually watch the user's position
  mapInstance.locate({ setView: false, watch: true, maxZoom: 16, enableHighAccuracy: true });

  let userMarker = null;

  mapInstance.on('locationfound', (e) => {
    if (!userMarker) {
      // Create a glowing blue dot for user location
      const userIcon = L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: var(--accent-blue); width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 12px var(--accent-blue); border: 2px solid #fff;"></div>`
      });
      userMarker = L.marker(e.latlng, { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstance);
      userMarker.bindPopup("<b>You are here</b> (Live GPS)").openPopup();
      
      // Optionally fly to user location on first fix
      mapInstance.flyTo(e.latlng, 15);
    } else {
      userMarker.setLatLng(e.latlng);
    }
  });

  mapInstance.on('locationerror', (e) => {
    console.warn("Real-time GPS access denied or unavailable: " + e.message);
  });
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
