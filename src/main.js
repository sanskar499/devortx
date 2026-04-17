import { initRiskMap } from './components/RiskMap.js';
import { setupSubmissionForm } from './components/SubmissionForm.js';
import { setupModeratorQueue } from './components/ModeratorQueue.js';
import { setupMyReports } from './components/MyReports.js';
import { setupSystemLog } from './components/SystemLog.js';
import { setupTelemetry } from './components/Telemetry.js';
import { state } from './services/MockState.js';

document.addEventListener('DOMContentLoaded', () => {
  // Navigation handling
  const navLinks = document.querySelectorAll('.nav-links li');
  const sections = document.querySelectorAll('.view-section');

  // Auth Screen Logic
  const authScreen = document.getElementById('auth-screen');
  const appContainer = document.getElementById('app');
  const btnRoleCitizen = document.getElementById('btn-role-citizen');
  const btnRoleAdmin = document.getElementById('btn-role-admin');
  const adminLoginForm = document.getElementById('admin-login-form');
  const btnAdminLogin = document.getElementById('btn-admin-login');
  const btnBackToRoles = document.getElementById('btn-back-to-roles');

  function setRole(role) {
    state.currentUserRole = role;
    authScreen.style.display = 'none';
    appContainer.style.display = 'flex';
    
    // Hide nav items not meant for this role
    navLinks.forEach(li => {
      const allowed = li.getAttribute('data-role');
      if (allowed !== 'all' && allowed !== role) {
        li.style.display = 'none';
      }
    });

    // Reset active view based on role
    const defaultView = role === 'admin' ? 'command-view' : 'map-view';
    document.querySelector(`.nav-links li[data-view="${defaultView}"]`).click();

    // Fix map resize issue immediately
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  }

  btnRoleCitizen.addEventListener('click', () => setRole('citizen'));
  
  btnRoleAdmin.addEventListener('click', () => {
    btnRoleAdmin.classList.add('hidden');
    adminLoginForm.classList.remove('hidden');
  });

  btnBackToRoles.addEventListener('click', () => {
    btnRoleAdmin.classList.remove('hidden');
    adminLoginForm.classList.add('hidden');
  });

  btnAdminLogin.addEventListener('click', () => {
    const id = document.getElementById('admin-id').value;
    const pass = document.getElementById('admin-pass').value;

    if (id === 'admin' && pass === 'resiligen123') {
        setRole('admin');
        window.showToast("Access Granted. Welcome, Commander.", "success");
    } else {
        window.showToast("Invalid Credentials. Access Denied.", "danger");
    }
  });

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
  setupSystemLog(document.getElementById('system-log'));
  setupTelemetry(document.getElementById('telemetry-container'));

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
  toast.className = `toast log-${type}`; // Sync styles with logs
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
};
