import { state } from '../services/MockState.js';

export function setupMyReports(container) {
  let boundContainer = container;
  
  state.subscribe((s) => renderCards(s, boundContainer));
  renderCards(state, boundContainer);
}

function renderCards(currentState, container) {
  // Prevent rendering if not citizen
  if (currentState.currentUserRole !== 'citizen') return;

  const myReports = currentState.getUserReports();
  
  if (myReports.length === 0) {
    container.innerHTML = `<p style="color:var(--text-secondary)">You haven't submitted any reports yet.</p>`;
    return;
  }

  container.innerHTML = myReports.map(report => `
    <div class="queue-card glass-panel" style="opacity: ${report.status === 'rejected' ? '0.6' : '1'}">
      <div class="card-header">
        <span class="ai-score" style="border-color: ${report.status === 'approved' ? 'var(--verified-green)' : report.status === 'rejected' ? 'var(--danger-red)' : 'var(--hazard-orange)'}; color: ${report.status === 'approved' ? 'var(--verified-green)' : report.status === 'rejected' ? 'var(--danger-red)' : 'var(--hazard-orange)'}">
          Status: ${report.status.toUpperCase()}
        </span>
        <small style="color:var(--text-secondary)">${new Date(report.timestamp).toLocaleTimeString()}</small>
      </div>
      <div class="card-body">
        <p><strong>Desc:</strong> "${report.description}"</p>
        ${report.status === 'approved' ? `<p style="margin-top:0.5rem; color:var(--verified-green)">✓ Validated by Moderator. Added to ledger.</p>` : ''}
        ${report.status === 'pending' ? `<p style="margin-top:0.5rem; color:var(--hazard-orange)">⏳ Pending Admin Review.</p>` : ''}
        ${report.status === 'rejected' ? `<p style="margin-top:0.5rem; color:var(--danger-red)">✗ Rejected. Insufficient evidence.</p>` : ''}
      </div>
    </div>
  `).join('');
}
