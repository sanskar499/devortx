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
            // Randomly choose a road axis for this seed point: 'lat-axis' (V) or 'lng-axis' (H)
            const axis = Math.random() > 0.5 ? 'lat' : 'lng';
            this.cells.set(key, { lat: p.lat, lng: p.lng, level: 1.0, axis });
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
        if (!this.active || this.iteration > 30) return;
        
        this.iteration++;
        const nextCells = new Map(this.cells);

        // Spread logic
        this.cells.forEach((cell, key) => {
            if (cell.level < 0.1) return;

            // Neighbors: Primary axis gets full spread, perpendicular gets minimal or none
            const neighbors = [];
            
            if (cell.axis === 'lat') {
                // Vertical Road
                neighbors.push({ lat: cell.lat + this.gridSize, lng: cell.lng, axis: 'lat' });
                neighbors.push({ lat: cell.lat - this.gridSize, lng: cell.lng, axis: 'lat' });
            } else {
                // Horizontal Road
                neighbors.push({ lat: cell.lat, lng: cell.lng + this.gridSize, axis: 'lng' });
                neighbors.push({ lat: cell.lat, lng: cell.lng - this.gridSize, axis: 'lng' });
            }

            neighbors.forEach(n => {
                const nKey = this._getPosKey(n.lat, n.lng);
                const current = nextCells.get(nKey) || { lat: n.lat, lng: n.lng, level: 0, axis: n.axis };
                
                // Spread water
                const flow = cell.level * 0.6;
                current.level = Math.min(1.0, current.level + flow);
                nextCells.set(nKey, current);
            });

            // Source remains strong but drifts slightly less
            cell.level *= 0.9;
            nextCells.set(key, cell);
        });

        this.cells = nextCells;
        this._render();
        
        this.timer = setTimeout(() => this._loop(), 500); // Faster iteration for demo
    }

    _render() {
        if (!this.layer) return;
        this.layer.clearLayers();

        this.cells.forEach(cell => {
            if (cell.level < 0.1) return;

            const bounds = [
                [cell.lat - this.gridSize/1.8, cell.lng - this.gridSize/1.8],
                [cell.lat + this.gridSize/1.8, cell.lng + this.gridSize/1.8]
            ];

            L.rectangle(bounds, {
                color: 'var(--accent-cyan)',
                weight: 0.5,
                fillColor: 'var(--accent-cyan)',
                fillOpacity: cell.level * 0.6,
                interactive: false
            }).addTo(this.layer);
        });
    }
}
