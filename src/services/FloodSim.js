/**
 * Flood Simulation Logic (Linear/Road Spread)
 * Simulates water following a random road axis (H or V) from seed points.
 */
export class FloodSim {
    constructor(mapInstance) {
        this.map = mapInstance;
        this.gridSize = 0.0008; // High precision (~80m)
        this.cells = new Map();
        this.active = false;
        this.iteration = 0;
        this.layer = null;
        this.timer = null;
    }

    start(points) {
        this.active = true;
        this.iteration = 0;
        this.cells.clear();
        
        // Initialize cells from trigger points (approved reports)
        points.forEach(p => {
            const key = this._getPosKey(p.lat, p.lng);
            // Randomly choose a road axis for this seed point
            const axis = Math.random() > 0.5 ? 'lat' : 'lng';
            // Store origin to manage area-based capping
            this.cells.set(key, { 
                lat: p.lat, lng: p.lng, 
                level: 1.0, axis, 
                origin: { lat: p.lat, lng: p.lng } 
            });
        });

        if (!this.layer) {
            this.layer = L.layerGroup().addTo(this.map);
        } else {
            this.layer.clearLayers();
        }

        this._loop();
    }

    stop() {
        this.active = false;
        if (this.timer) clearTimeout(this.timer);
        if (this.layer) this.layer.clearLayers();
    }

    _getPosKey(lat, lng) {
        const rLat = Math.round(lat / this.gridSize) * this.gridSize;
        const rLng = Math.round(lng / this.gridSize) * this.gridSize;
        return `${rLat.toFixed(5)},${rLng.toFixed(5)}`;
    }

    _loop() {
        // Cap iterations to keep simulation localized
        if (!this.active || this.iteration > 25) return;
        
        this.iteration++;
        const nextCells = new Map(this.cells);
        const MAX_SPREAD_DEG = 0.02; // Approx 2.2km capping

        // Spread logic
        this.cells.forEach((cell, key) => {
            if (cell.level < 0.15) return;

            const neighbors = [];
            if (cell.axis === 'lat') {
                neighbors.push({ lat: cell.lat + this.gridSize, lng: cell.lng, axis: 'lat' });
                neighbors.push({ lat: cell.lat - this.gridSize, lng: cell.lng, axis: 'lat' });
            } else {
                neighbors.push({ lat: cell.lat, lng: cell.lng + this.gridSize, axis: 'lng' });
                neighbors.push({ lat: cell.lat, lng: cell.lng - this.gridSize, axis: 'lng' });
            }

            neighbors.forEach(n => {
                // Distance capping logic
                const distLat = Math.abs(n.lat - cell.origin.lat);
                const distLng = Math.abs(n.lng - cell.origin.lng);
                
                if (distLat > MAX_SPREAD_DEG || distLng > MAX_SPREAD_DEG) return;

                const nKey = this._getPosKey(n.lat, n.lng);
                const current = nextCells.get(nKey) || { 
                    lat: n.lat, lng: n.lng, 
                    level: 0, 
                    axis: n.axis, 
                    origin: cell.origin 
                };
                
                // Spread water with decay
                const flow = cell.level * (0.55 - (this.iteration * 0.01));
                current.level = Math.min(1.0, current.level + flow);
                nextCells.set(nKey, current);
            });

            // Evaporation / Saturation decay
            cell.level *= 0.85;
            nextCells.set(key, cell);
        });

        this.cells = nextCells;
        this._render();
        
        this.timer = setTimeout(() => this._loop(), 400); 
    }

    _render() {
        if (!this.layer) return;
        this.layer.clearLayers();

        this.cells.forEach(cell => {
            if (cell.level < 0.15) return;

            // Use circular heat-map type rendering
            const color = cell.level > 0.8 ? '#06b6d4' : '#3b82f6';
            const radius = (this.gridSize * 150000) * (cell.level * 0.9); // Dynamic visual radius

            L.circle([cell.lat, cell.lng], {
                radius: radius,
                stroke: false,
                fillColor: color,
                fillOpacity: cell.level * 0.35,
                interactive: false
            }).addTo(this.layer);
        });
    }
}
