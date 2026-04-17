import Chart from 'chart.js/auto';
import { state } from '../services/MockState.js';

export function setupTelemetry(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="telemetry-grid">
            <div class="chart-container glass-panel">
                <h5>Rainfall Intensity (mm/h)</h5>
                <canvas id="rain-chart"></canvas>
            </div>
            <div class="chart-container glass-panel">
                <h5>Urban Risk Index</h5>
                <canvas id="risk-chart"></canvas>
            </div>
        </div>
    `;

    const rainCtx = document.getElementById('rain-chart').getContext('2d');
    const riskCtx = document.getElementById('risk-chart').getContext('2d');

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { display: false },
            y: { 
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#94a3b8', font: { size: 10 } }
            }
        },
        plugins: { legend: { display: false } },
        elements: { line: { tension: 0.4 }, point: { radius: 0 } }
    };

    const rainChart = new Chart(rainCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                data: [],
                borderColor: '#06b6d4',
                borderWidth: 2,
                fill: true,
                backgroundColor: 'rgba(6, 182, 212, 0.1)'
            }]
        },
        options: commonOptions
    });

    const riskChart = new Chart(riskCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                data: [],
                borderColor: '#ef4444',
                borderWidth: 2,
                fill: true,
                backgroundColor: 'rgba(239, 68, 68, 0.1)'
            }]
        },
        options: commonOptions
    });

    state.subscribe((currentState) => {
        const labels = currentState.telemetry.rainfall.map(t => t.x);
        
        rainChart.data.labels = labels;
        rainChart.data.datasets[0].data = currentState.telemetry.rainfall.map(t => t.y);
        rainChart.update('none');

        riskChart.data.labels = labels;
        riskChart.data.datasets[0].data = currentState.telemetry.riskLevel.map(t => t.y);
        riskChart.update('none');
    });
}
