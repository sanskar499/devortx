class MockState {
  constructor() {
    this.reports = [];
    this.userScore = 0;
    this.listeners = [];
    this.currentUserRole = 'citizen';
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(l => l(this));
  }

  addReport(report) {
    // Generate an ID
    report.id = 'rpt_' + Math.random().toString(36).substr(2, 9);
    report.status = 'pending';
    report.timestamp = new Date().toISOString();
    report.ownerId = 'current_user';
    this.reports.push(report);
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
      this.notify();
    }
    return r;
  }

  rejectReport(id) {
    const r = this.reports.find(r => r.id === id);
    if (r) {
      r.status = 'rejected';
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
}

export const state = new MockState();
