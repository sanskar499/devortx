import { state } from '../services/MockState.js';
import { mintContribution } from '../services/blockchain.js';

export function setupModeratorQueue(container) {
  if (!container) return;
  
  const render = () => {
    const pending = state.getPendingReports();
    
    if (pending.length === 0) {
      container.innerHTML = `
        <div class="empty-state glass-panel">
            <span class="icon">✅</span>
            <p>The queue is empty. All safe!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = pending.map(report => {
      const isHighRisk = report.aiAnalysis.confidence > 80;
      return `
        <div class="queue-card glass-panel ${isHighRisk ? 'verified' : ''}">
          <div class="card-header">
            <span class="ai-score">AI Match: ${report.aiAnalysis.confidence.toFixed(1)}%</span>
            <small>${new Date(report.timestamp).toLocaleTimeString()}</small>
          </div>
          <div class="card-body">
            <p><strong>Incident:</strong> "${report.description}"</p>
            <div class="card-meta">
                <span class="tag">${report.aiAnalysis.inferredTags.join('</span> <span class="tag">')}</span>
            </div>
            <div class="ai-insight">
               🤖 <i>${report.aiAnalysis.analysis}</i>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-success action-btn" data-id="${report.id}" data-action="approve">✓ Approve</button>
            <button class="btn btn-danger action-btn" data-id="${report.id}" data-action="reject">✗ Drop</button>
          </div>
        </div>
      `;
    }).join('');

    // Re-attach listeners after each render
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
    btn.textContent = 'Processing...';

    if (action === 'approve') {
      const approvedRep = state.approveReport(id);
      try {
          const receipt = await mintContribution(approvedRep);
          state.addScore(receipt.rewardXP);
          window.showToast(`Report Approved. Block Anchored. (+${receipt.rewardXP} XP)`, 'success');
      } catch (err) {
          window.showToast("Ledger sync interrupted. Retrying...", "warning");
      }
    } else {
      state.rejectReport(id);
      window.showToast("Report rejected.", "info");
    }
    
    // State notify will trigger re-render
  }

  state.subscribe(render);
  render();
}
