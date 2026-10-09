import React from 'react';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  Bed, 
  Bell, 
  FileSearch,
  Activity,
  CheckCircle
} from 'lucide-react';
import { soundFx } from '../utils/soundFx';
import { PATIENT_STATES } from '../data/initialPatients';

export default function AdminView({ 
  patients, 
  historicalStats,
  dischargeAlerts,
  onDismissAlert,
  onTurnoverBed,
  duplicateAttemptsBlocked
}) {
  // Real-time calculation of mortality rate
  const currentDeceased = patients.filter(p => p.outcome === 'DECEASED').length;
  const currentDischarged = patients.filter(p => p.outcome === 'DISCHARGED').length;

  const totalDeceased = historicalStats.pastDeceased + currentDeceased;
  const totalDischarged = historicalStats.pastDischarges + currentDischarged;
  const totalClosedCases = totalDeceased + totalDischarged;

  const rollingMortalityRate = totalClosedCases > 0 
    ? Math.round((totalDeceased / totalClosedCases) * 1000) / 10 
    : 0;

  const isAnomalyTriggered = rollingMortalityRate >= 15.0;

  // Stagnant discharge beds
  const dischargePendingRooms = patients.filter(p => p.state === PATIENT_STATES.DISCHARGE_PENDING);
  const bedTurnoverRooms = patients.filter(p => p.state === PATIENT_STATES.BED_TURNOVER);
  const availableRooms = patients.filter(p => p.state === PATIENT_STATES.AVAILABLE);

  const handleStartCleaning = (patientId) => {
    soundFx.playTap();
    onTurnoverBed(patientId, 'CLEANING');
  };

  const handleCompleteSanitization = (patientId) => {
    soundFx.playLockoutSuccess();
    onTurnoverBed(patientId, 'AVAILABLE');
  };

  return (
    <div className="admin-container">
      {/* Top Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Admin & Operations</h2>
          <span className="view-badge">Facility Overview</span>
        </div>

        <div className="metrics-summary-row">
          <div className="stat-pill stat-pill-pending">
            <span className="stat-pill-num">
              {dischargePendingRooms.length + bedTurnoverRooms.length}
            </span>
            <span className="stat-pill-label">Bed Turnover</span>
          </div>
          <div className="stat-pill stat-pill-done">
            <span className="stat-pill-num">{duplicateAttemptsBlocked}</span>
            <span className="stat-pill-label">Re-tests Prevented</span>
          </div>
          <div className={`stat-pill ${isAnomalyTriggered ? 'stat-pill-alert' : 'stat-pill-done'}`}>
            <span className="stat-pill-num">{rollingMortalityRate.toFixed(1)}%</span>
            <span className="stat-pill-label">Rolling Mortality</span>
          </div>
        </div>
      </div>

      {/* Instant Discharge Alerts */}
      {dischargeAlerts.length > 0 && (
        <div className="discharge-alert-card">
          <div className="alert-content-left">
            <div className="alert-icon-box">
              <Bell size={20} />
            </div>
            <div>
              <h4>Discharge Confirmed ({dischargeAlerts.length})</h4>
              <p>
                Rooms {dischargeAlerts.map(a => a.room).join(', ')} confirmed for discharge. Ready for bed cleaning.
              </p>
            </div>
          </div>
          <div className="alert-actions">
            {dischargeAlerts.map(alert => (
              <button
                key={alert.id}
                className="btn-acknowledge"
                onClick={() => {
                  soundFx.playTap();
                  onDismissAlert(alert.id);
                }}
              >
                Acknowledge {alert.room}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Amber Anomaly Flag Banner (Mortality >= 15%) */}
      {isAnomalyTriggered && (
        <div className="anomaly-warning-banner">
          <div className="anomaly-icon-box">
            <AlertTriangle size={24} />
          </div>
          <div className="anomaly-message">
            <h4>Anomaly Alert: Rolling Mortality at {rollingMortalityRate.toFixed(1)}%</h4>
            <p>
              Threshold of 15.0% exceeded. Mandatory protocol: Team lead clinical review and batch audit required.
            </p>
          </div>
          <div className="anomaly-tag">
            <FileSearch size={15} /> Audit Required
          </div>
        </div>
      )}

      {/* Key Metric Summary Cards */}
      <div className="metrics-cards-grid">
        <div className="metric-overview-card">
          <div className="card-top">
            <span className="card-label">Prevented Re-tests</span>
            <ShieldCheck size={18} className="text-forest" />
          </div>
          <div className="card-val">{duplicateAttemptsBlocked}</div>
          <p className="card-footnote">Lockout guard prevented duplicate patient visits.</p>
        </div>

        <div className="metric-overview-card">
          <div className="card-top">
            <span className="card-label">Queue Compliance</span>
            <Clock size={18} className="text-forest" />
          </div>
          <div className="card-val">100%</div>
          <p className="card-footnote">Rooms without vitals locked from physician entry.</p>
        </div>

        <div className="metric-overview-card">
          <div className="card-top">
            <span className="card-label">Beds in Turnover</span>
            <Bed size={18} className="text-forest" />
          </div>
          <div className="card-val">
            {dischargePendingRooms.length + bedTurnoverRooms.length}
          </div>
          <p className="card-footnote">Discharge orders relayed immediately to cleaning queue.</p>
        </div>
      </div>

      {/* Main Grid: Dynamic Mortality Thermometer & Bed Velocity Management */}
      <div className="admin-split-grid">
        {/* Dynamic Mortality Thermometer */}
        <div className="gauge-panel-card">
          <div className="panel-header">
            <div>
              <h3>Mortality Thermometer</h3>
              <span className="panel-subtitle">Rolling Statistical Tracking</span>
            </div>
            <span className="formula-badge">Deceased ÷ (Discharged + Deceased)</span>
          </div>

          <div className="thermometer-layout">
            {/* Visual Mercury Tube */}
            <div className="mercury-tube-container">
              <div className="tube-scale-labels">
                <span>30%</span>
                <span className="threshold-label">15% Limit</span>
                <span>0%</span>
              </div>
              <div className="mercury-glass-tube">
                <div 
                  className={`mercury-column ${isAnomalyTriggered ? 'column-anomaly' : rollingMortalityRate > 10 ? 'column-warning' : 'column-normal'}`}
                  style={{ height: `${Math.min(100, (rollingMortalityRate / 30) * 100)}%` }}
                ></div>
                <div className="limit-line" style={{ bottom: '50%' }}></div>
              </div>
              <div className="mercury-bulb-base">
                <div className={`bulb-inner ${isAnomalyTriggered ? 'bulb-anomaly' : 'bulb-normal'}`}></div>
              </div>
            </div>

            {/* Readout statistics */}
            <div className="thermometer-details">
              <div className="rate-box">
                <span className="rate-label">Rolling Mortality Rate</span>
                <div className="rate-digits-row">
                  <span className={`rate-number ${isAnomalyTriggered ? 'text-rose' : 'text-forest'}`}>
                    {rollingMortalityRate.toFixed(1)}%
                  </span>
                  <span className={`rate-status ${isAnomalyTriggered ? 'status-alert' : 'status-ok'}`}>
                    {isAnomalyTriggered ? 'Above Threshold' : 'Normal Range'}
                  </span>
                </div>
              </div>

              <div className="cases-summary-list">
                <div className="summary-row">
                  <span>Discharges:</span>
                  <strong>{totalDischarged}</strong>
                </div>
                <div className="summary-row">
                  <span>Mortality:</span>
                  <strong>{totalDeceased}</strong>
                </div>
                <div className="summary-row total-row">
                  <span>Total Outcomes:</span>
                  <strong>{totalClosedCases}</strong>
                </div>
              </div>

              <div className="gauge-note">
                <Activity size={14} className="text-forest" />
                <span>Rate recalculates automatically upon every discharge or mortality event.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bed Turnover Queue */}
        <div className="turnaround-panel-card">
          <div className="panel-header">
            <div>
              <h3>Bed Turnover</h3>
              <span className="panel-subtitle">Cleaning & Sanitization</span>
            </div>
            <span className="panel-count-tag">
              {dischargePendingRooms.length + bedTurnoverRooms.length} Pending
            </span>
          </div>

          <div className="turnaround-list">
            {dischargePendingRooms.length === 0 && bedTurnoverRooms.length === 0 ? (
              <div className="empty-box">
                <CheckCircle2 size={32} className="text-forest" />
                <p>All discharge beds sanitized and turnover complete.</p>
              </div>
            ) : (
              <>
                {dischargePendingRooms.map(p => (
                  <div key={p.id} className="turnover-card card-waiting">
                    <div className="turnover-card-header">
                      <div className="room-title">
                        <span className="room-tag">{p.room}</span>
                        <strong>{p.name}</strong>
                      </div>
                      <span className="status-badge-waiting">Awaiting Cleaning</span>
                    </div>
                    <p className="turnover-desc">
                      Discharged by physician. Ready for terminal cleaning.
                    </p>
                    <button 
                      className="btn-start-clean"
                      onClick={() => handleStartCleaning(p.id)}
                    >
                      <Bed size={14} /> Start Cleaning
                    </button>
                  </div>
                ))}

                {bedTurnoverRooms.map(p => (
                  <div key={p.id} className="turnover-card card-cleaning">
                    <div className="turnover-card-header">
                      <div className="room-title">
                        <span className="room-tag tag-cleaning">{p.room}</span>
                        <strong>{p.name}</strong>
                      </div>
                      <span className="status-badge-cleaning">
                        <RotateCcw size={12} className="spin-slow" /> Cleaning in Progress
                      </span>
                    </div>
                    <p className="turnover-desc">
                      Decontamination and linen reset underway.
                    </p>
                    <button 
                      className="btn-finish-clean"
                      onClick={() => handleCompleteSanitization(p.id)}
                    >
                      <CheckCircle size={14} /> Mark Bed Available
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Available Beds */}
          <div className="available-beds-footer">
            <span className="footer-label">Available Beds ({availableRooms.length}):</span>
            <div className="available-tags">
              {availableRooms.map(r => (
                <span key={r.id} className="bed-ready-tag">
                  {r.room}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
