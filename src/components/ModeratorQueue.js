import { state } from '../services/MockState.js';
import { mintContribution } from '../services/blockchain.js';

export function setupModeratorQueue(container) {
  let boundContainer = container;
  
  state.subscribe((s) => renderCards(s, boundContainer));
  renderCards(state, boundContainer);
}

function renderCards(currentState, container) {
  const pending = currentState.getPendingReports();
  
  if (pending.length === 0) {
    container.innerHTML = `<p style="color:var(--text-secondary)">The queue is empty. All safe!</p>`;
    return;
  }

  container.innerHTML = pending.map(report => `
    <div class="queue-card glass-panel">
      <div class="card-header">
        <span class="ai-score" title="AI Confidence Score">AI Match: ${report.aiAnalysis.confidence.toFixed(1)}%</span>
        <small style="color:var(--text-secondary)">${new Date(report.timestamp).toLocaleTimeString()}</small>
      </div>
      <div class="card-body">
        <p><strong>Desc:</strong> "${report.description}"</p>
        <p style="margin-top:0.5rem; color:var(--hazard-orange)"><strong>AI Inferred:</strong> ${report.aiAnalysis.inferredTags.join(', ')}</p>
        <p style="margin-top:0.5rem; font-size:0.85rem; padding:0.5rem; background:rgba(0,0,0,0.2); border-radius:4px;">
           🤖 <i>${report.aiAnalysis.analysis}</i>
        </p>
      </div>
      <div class="card-actions">
        <button class="btn btn-success action-btn" data-id="${report.id}" data-action="approve">✓ Validate</button>
        <button class="btn btn-danger action-btn" data-id="${report.id}" data-action="reject">✗ Reject</button>
      </div>
    </div>
  `).join('');

  // Attach event listeners
  const buttons = container.querySelectorAll('.action-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      const action = e.target.getAttribute('data-action');
      
      // Update UI optimistically
      e.target.parentElement.parentElement.style.opacity = '0.5';
      e.target.parentElement.innerHTML = 'Processing block...';

      if (action === 'approve') {
        const approvedRep = state.approveReport(id);
        const receipt = await mintContribution(approvedRep);
        state.addScore(receipt.rewardXP);
        window.showToast(`Report Anchored. Tx: ${receipt.txHash.substring(0,8)}... (+${receipt.rewardXP} XP)`, 'success');
      } else {
        state.rejectReport(id);
        window.showToast(`Report dropped as noise.`, '');
      }
    });
  });
}
