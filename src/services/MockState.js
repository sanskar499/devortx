class MockState {
  constructor() {
    this.reports = JSON.parse(localStorage.getItem('resiligen_reports')) || [];
    this.userScore = parseInt(localStorage.getItem('resiligen_score')) || 0;
    this.logs = [];
    this.telemetry = {
      rainfall: [],
      riskLevel: []
    };
    this.listeners = [];
    this.currentUserRole = 'citizen';
    
    // Start background simulation of telemetry
    this._startSimulation();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    localStorage.setItem('resiligen_reports', JSON.stringify(this.reports));
    localStorage.setItem('resiligen_score', this.userScore.toString());
    this.listeners.forEach(l => l(this));
  }

  addLog(message, type = 'info') {
    this.logs.unshift({
      id: Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    });
    if (this.logs.length > 50) this.logs.pop();
    this.notify();
  }

  addReport(report) {
    report.id = 'rpt_' + Math.random().toString(36).substr(2, 9);
    report.status = 'pending';
    report.timestamp = new Date().toISOString();
    report.ownerId = 'current_user';
    this.reports.push(report);
    this.addLog(`New report submitted: ${report.id.substring(0, 8)}...`, 'warning');
    this.notify();
  }

  getPendingReports() {
    return this.reports.filter(r => r.status === 'pending');
  }

  getUserReports() {
    return this.reports.filter(r => r.ownerId === 'current_user');
  }

  getApprovedReports() {
    return this.reports.filter(r => r.status === 'approved');
  }

  approveReport(id) {
    const r = this.reports.find(r => r.id === id);
    if (r) {
      r.status = 'approved';
      this.addLog(`Report ${id.substring(0, 8)} approved and appended to ledger.`, 'success');
      this.notify();
    }
    return r;
  }

  rejectReport(id) {
    const r = this.reports.find(r => r.id === id);
    if (r) {
      r.status = 'rejected';
      this.addLog(`Report ${id.substring(0, 8)} rejected by consensus.`, 'danger');
      this.notify();
    }
  }

  addScore(points) {
    this.userScore += points;
    this.notify();
  }

  getUserScore() {
    return this.userScore;
  }

  _startSimulation() {
    setInterval(() => {
      const now = new Date();
      const nowStr = now.toLocaleTimeString();
      const rain = Math.random() * 5 + 2;
      const risk = (rain * 1.5) + (this.getApprovedReports().length * 2) + (Math.random() * 5);
      
      this.telemetry.rainfall.push({ x: nowStr, y: rain });
      this.telemetry.riskLevel.push({ x: nowStr, y: risk });
      
      if (this.telemetry.rainfall.length > 20) {
        this.telemetry.rainfall.shift();
        this.telemetry.riskLevel.shift();
      }
      
      // TIMELINE CHECK: 2 Minutes Threshold (Demo Mode)
      const TIMEOUT_MS = 2 * 60 * 1000;
      let checkTriggered = false;

      this.reports.forEach(r => {
        if (r.status === 'approved' && !r.requiresUpdate) {
            const age = now - new Date(r.timestamp);
            if (age > TIMEOUT_MS) {
                r.requiresUpdate = true;
                this.addLog(`System identifying stale data for incident ${r.id.substring(0,8)}. Requesting updated telemetry...`, 'warning');
                checkTriggered = true;
            }
        }
      });
      
      if (Math.random() > 0.8) {
        this.addLog(`AI Model verifying block ${Math.floor(Math.random() * 10000)}...`, 'info');
      }
      
      this.notify();
    }, 3000);
  }

  requestCitizenUpdate(id) {
    const r = this.reports.find(r => r.id === id);
    if (r) {
        r.updateRequested = true;
        this.addLog(`Update request sent to citizen for report ${id.substring(0,8)}.`, 'info');
        this.notify();
    }
  }

export const state = new MockState();
