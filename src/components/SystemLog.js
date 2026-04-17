import { state } from '../services/MockState.js';

export function setupSystemLog(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="system-log-header">
            <h4><span class="pulse-dot"></span> Network Live Feed</h4>
        </div>
        <div id="log-feed" class="log-feed"></div>
    `;

    const feedElem = document.getElementById('log-feed');

    const updateLog = (currentState) => {
        feedElem.innerHTML = currentState.logs.map(log => `
            <div class="log-item log-${log.type}">
                <span class="log-time">[${log.timestamp}]</span>
                <span class="log-msg">${log.message}</span>
            </div>
        `).join('');
    };

    state.subscribe(updateLog);
    updateLog(state);
}
