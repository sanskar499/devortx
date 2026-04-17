import { state } from '../services/MockState.js';
import { mintContribution } from '../services/blockchain.js';

export function setupModeratorQueue(container) {
  if (!container) return;
  
  const render = () => {
    const pending = state.getPendingReports();
    const needsUpdate = state.reports.filter(r => r.requiresUpdate && !r.updateRequested);
    
    if (pending.length === 0 && needsUpdate.length === 0) {
      container.innerHTML = `
        <div class="empty-state glass-panel">
            <span class="icon">✅</span>
            <p>The queue is empty. All safe!</p>
        </div>
      `;
      return;
    }

    const items = [...pending, ...needsUpdate];

    container.innerHTML = items.map(report => {
      const isHighRisk = report.aiAnalysis && report.aiAnalysis.confidence > 80;
      const isStale = report.requiresUpdate;
      
      return `
        <div class="queue-card glass-panel ${isHighRisk ? 'verified' : ''} ${isStale ? 'stale' : ''}">
          <div class="card-header">
            ${isStale ? '<span class="status-badge stale-badge">⚠️ UPDATE NEEDED (2H+)</span>' : `<span class="ai-score">AI Match: ${report.aiAnalysis.confidence.toFixed(1)}%</span>`}
            <small>${new Date(report.timestamp).toLocaleTimeString()}</small>
          </div>
          <div class="card-body">
            <p><strong>Incident:</strong> "${report.description}"</p>
            <div class="card-meta">
                ${report.aiAnalysis ? `<span class="tag">${report.aiAnalysis.inferredTags.join('</span> <span class="tag">')}</span>` : ''}
            </div>
            ${report.aiAnalysis ? `
            <div class="ai-insight">
               🤖 <i>${report.aiAnalysis.analysis}</i>
            </div>` : ''}
          </div>
          <div class="card-actions">
            ${isStale ? 
                `<button class="btn btn-primary action-btn" data-id="${report.id}" data-action="request-update">Request Citizen Update</button>` :
                `<button class="btn btn-success action-btn" data-id="${report.id}" data-action="approve">✓ Approve</button>
                 <button class="btn btn-danger action-btn" data-id="${report.id}" data-action="reject">✗ Drop</button>`
            }
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleAction);
    });
  };

  async function handleAction(e) {
    const btn = e.target;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    const card = btn.closest('.queue-card');
    
    card.style.pointerEvents = 'none';
    card.style.opacity = '0.5';
    btn.textContent = 'Syncing...';

    if (action === 'approve') {
      const approvedRep = state.approveReport(id);
      try {
          const receipt = await mintContribution(approvedRep);
          state.addScore(receipt.rewardXP);
          window.showToast(`Block Anchored. Reward distributed.`, 'success');
      } catch (err) {
          window.showToast("Ledger sync interrupted.", "warning");
      }
    } else if (action === 'reject') {
      state.rejectReport(id);
      window.showToast("Report rejected.", "info");
    } else if (action === 'request-update') {
      state.requestCitizenUpdate(id);
      window.showToast("Follow-up request sent to reporter.", "success");
    }
  }

  state.subscribe(render);
  render();
}
