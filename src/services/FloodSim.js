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
            // Radial origin seed
            this.cells.set(key, { 
                lat: p.lat, lng: p.lng, 
                level: 1.0, 
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
        if (!this.active || this.iteration > 20) return;
        
        this.iteration++;
        const nextCells = new Map(this.cells);
        const MAX_SPREAD_DEG = 0.012; // Approx 1.3km capping for circular logic

        this.cells.forEach((cell, key) => {
            if (cell.level < 0.2) return;

            // Full 4-way radial spread (removes 'line' behavior)
            const neighbors = [
                { lat: cell.lat + this.gridSize, lng: cell.lng },
                { lat: cell.lat - this.gridSize, lng: cell.lng },
                { lat: cell.lat, lng: cell.lng + this.gridSize },
                { lat: cell.lat, lng: cell.lng - this.gridSize }
            ];

            neighbors.forEach(n => {
                const distLat = Math.abs(n.lat - cell.origin.lat);
                const distLng = Math.abs(n.lng - cell.origin.lng);
                
                if (distLat > MAX_SPREAD_DEG || distLng > MAX_SPREAD_DEG) return;

                const nKey = this._getPosKey(n.lat, n.lng);
                const current = nextCells.get(nKey) || { 
                    lat: n.lat, lng: n.lng, 
                    level: 0, 
                    origin: cell.origin 
                };
                
                // Spread water
                const flow = cell.level * (0.45 - (this.iteration * 0.015));
                current.level = Math.min(1.0, current.level + flow);
                nextCells.set(nKey, current);
            });

            // Fast dissipation to keep it circular/clumpy
            cell.level *= 0.75;
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
            if (cell.level < 0.2) return;

            // Render as circular heat points
            const color = cell.level > 0.8 ? '#06b6d4' : '#3b82f6';
            const radius = (this.gridSize * 160000) * (cell.level * 0.95);

            L.circle([cell.lat, cell.lng], {
                radius: radius,
                stroke: false,
                fillColor: color,
                fillOpacity: cell.level * 0.4,
                interactive: false
            }).addTo(this.layer);
        });
    }
}
