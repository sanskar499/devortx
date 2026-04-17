import { state } from '../services/MockState.js';
import { mintContribution } from '../services/blockchain.js';

export function setupModeratorQueue(container) {
  if (!container) return;
  
  const render = () => {
    const pending = state.getPendingReports();
    const needsUpdate = state.reports.filter(r => r.requiresUpdate && !r.updateRequested);
    const approved = state.getApprovedReports();
    
    if (pending.length === 0 && needsUpdate.length === 0 && approved.length === 0) {
      container.innerHTML = `
        <div class="empty-state glass-panel">
            <span class="icon">✅</span>
            <p>The network is clear. No active alerts.</p>
        </div>
      `;
      return;
    }

    const sections = [
        { title: '🛡️ Pending Verification', items: pending, action: 'triage' },
        { title: '⚠️ Stale Data - Follow Up', items: needsUpdate, action: 'update' },
        { title: '✅ Active Live Alerts', items: approved, action: 'manage' }
    ];

    container.innerHTML = sections.map(sec => {
        if (sec.items.length === 0) return '';
        return `
            <h3 class="queue-section-title">${sec.title}</h3>
            <div class="queue-grid">
                ${sec.items.map(report => renderCard(report, sec.action)).join('')}
            </div>
        `;
    }).join('');

    container.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleAction);
    });
  };

  const renderCard = (report, actionType) => {
    const ai = report.aiAnalysis || {};
    const ocr = ai.ocrEvidence || '';
    const hasOCR = ocr && ocr.trim().length > 0 && ocr !== 'No text detected';
    
    const isHighRisk = ai.confidence > 80;
    const isStale = report.requiresUpdate;
    const isApproved = report.status === 'approved';

    return `
      <div class="queue-card glass-panel ${isHighRisk ? 'verified' : ''} ${isStale ? 'stale' : ''} ${hasOCR ? 'corroborated' : ''} ${isApproved ? 'active-alert' : ''}">
        <div class="card-header">
          ${isStale ? '<span class="status-badge stale-badge">⚠️ UPDATE NEEDED</span>' : `<span class="ai-score">AI Match: ${ai.confidence?.toFixed(1) || 'N/A'}%</span>`}
          ${hasOCR ? '<span class="status-badge ocr-badge">🧠 OCR VERIFIED</span>' : ''}
          ${isApproved ? '<span class="status-badge live-badge">LIVE</span>' : ''}
          <small>${new Date(report.timestamp).toLocaleTimeString()}</small>
        </div>
        <div class="card-body">
          <p><strong>Incident:</strong> "${report.description}"</p>
          
          <div class="card-meta">
              ${ai.inferredTags ? `<span class="tag">${ai.inferredTags.join('</span> <span class="tag">')}</span>` : ''}
          </div>

          ${hasOCR ? `
          <div class="ocr-evidence-box">
              <div class="ocr-label"><span class="icon">👁️</span> MULTI-MODAL OCR EVIDENCE</div>
              <pre class="ocr-text">${ocr}</pre>
              <div class="ocr-status">✓ Text auto-corroborated with description</div>
          </div>` : ''}

          <div class="ai-insight-box">
             <div class="ai-label">🤖 COMMANDER AI INSIGHT</div>
             <p class="ai-msg">${ai.analysis || 'Analyzing infrastructure telemetry...'}</p>
          </div>
        </div>
        <div class="card-actions">
          ${actionType === 'update' ? 
              `<button class="btn btn-primary action-btn" data-id="${report.id}" data-action="request-update">Request Update</button>` :
            actionType === 'manage' ?
              `<button class="btn btn-danger action-btn" data-id="${report.id}" data-action="remove">❌ Remove from Live Map</button>` :
              `<button class="btn btn-success action-btn" data-id="${report.id}" data-action="approve">✓ Approve</button>
               <button class="btn btn-danger action-btn" data-id="${report.id}" data-action="reject">✗ Drop</button>`
          }
        </div>
      </div>
    `;
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
    } else if (action === 'remove') {
      state.removeReport(id);
      window.showToast("Incident recalled. Map updated.", "danger");
    }
  }

  state.subscribe(render);
  render();
}
