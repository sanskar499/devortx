import { initRiskMap } from './components/RiskMap.js';
import { setupSubmissionForm } from './components/SubmissionForm.js';
import { setupModeratorQueue } from './components/ModeratorQueue.js';
import { setupMyReports } from './components/MyReports.js';
import { state } from './services/MockState.js';

document.addEventListener('DOMContentLoaded', () => {
  // Navigation handling
  const navLinks = document.querySelectorAll('.nav-links li');
  const sections = document.querySelectorAll('.view-section');

  // Role Selection Logic
  const roleModal = document.getElementById('role-modal');
  const appContainer = document.getElementById('app');

  function setRole(role) {
    state.currentUserRole = role;
    roleModal.style.display = 'none';
    appContainer.style.display = 'flex';
    
    // Hide nav items not meant for this role
    navLinks.forEach(li => {
      const allowed = li.getAttribute('data-role');
      if (allowed !== 'all' && allowed !== role) {
        li.style.display = 'none';
      }
    });

    // Reset active view based on role
    document.querySelector('.nav-links li[data-view="map-view"]').click();
  }

  document.getElementById('btn-role-citizen').addEventListener('click', () => setRole('citizen'));
  document.getElementById('btn-role-admin').addEventListener('click', () => setRole('admin'));

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Update active nav
      document.querySelector('.nav-links li.active').classList.remove('active');
      link.classList.add('active');

      // Update active view
      const targetId = link.getAttribute('data-view');
      sections.forEach(sec => {
        if (sec.id === targetId) {
          sec.classList.remove('hidden');
          sec.classList.add('active');
        } else {
          sec.classList.add('hidden');
          sec.classList.remove('active');
        }
      });
      
      // Specifically handle map re-sizing issue when displaying none
      if (targetId === 'map-view') {
        window.dispatchEvent(new Event('resize'));
      }
    });
  });

  // Init Modules
  initRiskMap(document.getElementById('map'));
  setupSubmissionForm(document.getElementById('submission-form-container'));
  setupModeratorQueue(document.getElementById('moderator-queue-container'));
  setupMyReports(document.getElementById('my-reports-container'));

  // Subscribe to state changes to update the queue badge
  state.subscribe(() => {
    const pendingCount = state.getPendingReports().length;
    const badge = document.getElementById('queue-badge');
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
    
    // Update user reputation
    document.getElementById('user-reputation').textContent = `Rep: ${state.getUserScore()} XP`;
  });
});

// Global toast utility
window.showToast = function(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.innerHTML = `<span class="icon">${type === 'success' ? '✅' : 'ℹ️'}</span> <div>${message}</div>`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
};
