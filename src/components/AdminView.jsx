import React, { useState } from 'react';
import { 
  Building2, 
  AlertTriangle, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  RotateCcw, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Bed, 
  Bell, 
  ArrowRight, 
  Zap, 
  FileSearch,
  Activity,
  Layers,
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
  onAdmitPatient,
  duplicateAttemptsBlocked
}) {
  // Real-time calculation of mortality rate:
  // Live Mathematical Gauge: Mortality = (Total Deceased / (Total Discharged + Total Deceased)) * 100
  const currentDeceased = patients.filter(p => p.outcome === 'DECEASED').length;
  const currentDischarged = patients.filter(p => p.outcome === 'DISCHARGED').length;

  const totalDeceased = historicalStats.pastDeceased + currentDeceased;
  const totalDischarged = historicalStats.pastDischarges + currentDischarged;
  const totalClosedCases = totalDeceased + totalDischarged;

  const rollingMortalityRate = totalClosedCases > 0 
    ? Math.round((totalDeceased / totalClosedCases) * 1000) / 10 
    : 0;

  const isAnomalyTriggered = rollingMortalityRate >= 15.0;

  // Stagnant discharge beds (patients in DISCHARGE_PENDING or BED_TURNOVER)
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
      {/* Role Header */}
      <div className="role-subhead">
        <div className="role-badge-row">
          <span className="admin-role-pill">
            <Building2 size={16} />
            ROLE 03: CLINICAL OPERATIONS & ADMIN
          </span>
          <span className="survival-guardrail-badge">
            <Activity size={14} /> Survival Guardrails & Bed Velocity
          </span>
        </div>

        <div className="queue-metric-bar">
          <div className="metric-box">
            <span className="metric-label">Bed Turnover Queue</span>
            <span className="metric-val text-amber">
              {dischargePendingRooms.length + bedTurnoverRooms.length} Beds
            </span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Double-Dips Blocked</span>
            <span className="metric-val text-emerald">
              {duplicateAttemptsBlocked} Saved Visits
            </span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Rolling Mortality</span>
            <span className={`metric-val ${isAnomalyTriggered ? 'text-rose font-bold animate-pulse' : 'text-cyan'}`}>
              {rollingMortalityRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Instant Discharge Alerts Section */}
      {dischargeAlerts.length > 0 && (
        <div className="instant-discharge-alert-banner animate-slideDown">
          <div className="alert-left-content">
            <div className="alert-icon-ring">
              <Bell size={22} className="text-white animate-bounce" />
            </div>
            <div>
              <div className="alert-headline-tag">INSTANT DISCHARGE RELAY — ZERO BED STAGNANCY</div>
              <h4 className="alert-banner-title">
                {dischargeAlerts.length} Discharge(s) Confirmed by Attending Physician
              </h4>
              <p className="alert-banner-sub">
                Rooms {dischargeAlerts.map(a => a.room).join(', ')} confirmed ready for terminal cleaning. Dispatch environmental services immediately.
              </p>
            </div>
          </div>
          <div className="alert-action-btns">
            {dischargeAlerts.map(alert => (
              <button
                key={alert.id}
                className="acknowledge-alert-btn"
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

      {/* AMBER ANOMALY FLAG BANNER: Triggers when rolling mortality >= 15% */}
      {isAnomalyTriggered && (
        <div className="amber-anomaly-banner animate-pulse">
          <div className="anomaly-icon-wrap">
            <AlertTriangle size={28} className="text-amber-900" />
          </div>
          <div className="anomaly-text-wrap">
            <div className="anomaly-code">⚠️ AMBER ANOMALY FLAG: CLINICAL SURVIVAL GUARDRAIL EXCEEDED</div>
            <h3 className="anomaly-title">
              Rolling Mortality Reached {rollingMortalityRate.toFixed(1)}% (Threshold: 15.0%)
            </h3>
            <p className="anomaly-instruction">
              <strong>MANDATORY PROTOCOL:</strong> Team Leads and Chief Medical Officer instructed to conduct an immediate audit of treatment batches, medication lots, and ICU transfer latency.
            </p>
          </div>
          <div className="audit-action-chip">
            <FileSearch size={16} /> Batch Audit Initiated
          </div>
        </div>
      )}

      {/* The 3 Root Causes of Clinic Chaos: Live Engine Metrics */}
      <div className="chaos-elimination-grid">
        <div className="chaos-card">
          <div className="chaos-card-header">
            <span className="chaos-num">ROOT CAUSE 01</span>
            <ShieldCheck size={18} className="text-emerald" />
          </div>
          <h4>Duplicate Effort</h4>
          <div className="chaos-stat">
            <span className="stat-large text-emerald">{duplicateAttemptsBlocked}</span>
            <span className="stat-unit">Double-Dips Blocked</span>
          </div>
          <p className="chaos-desc">
            Lockout Guard turns room green and freezes buttons after vitals are entered, completely barring second checks.
          </p>
        </div>

        <div className="chaos-card">
          <div className="chaos-card-header">
            <span className="chaos-num">ROOT CAUSE 02</span>
            <Clock size={18} className="text-cyan" />
          </div>
          <h4>Out-of-Order Visits</h4>
          <div className="chaos-stat">
            <span className="stat-large text-cyan">100%</span>
            <span className="stat-unit">Sequence Enforced</span>
          </div>
          <p className="chaos-desc">
            Doctors cannot enter rooms awaiting nurse vitals ("Awaiting Nurse - Do Not Enter"), guarding precious clinician minutes.
          </p>
        </div>

        <div className="chaos-card">
          <div className="chaos-card-header">
            <span className="chaos-num">ROOT CAUSE 03</span>
            <Bed size={18} className="text-amber" />
          </div>
          <h4>Stagnant Discharge Beds</h4>
          <div className="chaos-stat">
            <span className="stat-large text-amber">
              {dischargePendingRooms.length + bedTurnoverRooms.length}
            </span>
            <span className="stat-unit">Active Turnover</span>
          </div>
          <p className="chaos-desc">
            Discharge confirmation relays instantaneously to Admin, cutting idle bed turnaround latency to near zero.
          </p>
        </div>
      </div>

      {/* Grid: Dynamic Mortality Thermometer & Bed Velocity Management */}
      <div className="admin-main-grid">
        {/* Dynamic Mortality Thermometer Gauge */}
        <div className="admin-gauge-card">
          <div className="gauge-card-header">
            <div>
              <div className="gauge-label-pill">SURVIVAL METRICS</div>
              <h3 className="gauge-card-title">Dynamic Mortality Thermometer</h3>
            </div>
            <span className="formula-tag">Formula: Deceased / (Discharges + Deceased)</span>
          </div>

          <div className="thermometer-visual-container">
            {/* Visual Mercury Tube */}
            <div className="mercury-tube-wrap">
              <div className="tube-scale">
                <span className="scale-mark text-rose">30%</span>
                <span className="scale-mark text-amber font-bold">15% Threshold</span>
                <span className="scale-mark text-emerald">0%</span>
              </div>
              <div className="mercury-tube">
                <div 
                  className={`mercury-fill ${isAnomalyTriggered ? 'fill-anomaly' : rollingMortalityRate > 10 ? 'fill-warning' : 'fill-safe'}`}
                  style={{ height: `${Math.min(100, (rollingMortalityRate / 30) * 100)}%` }}
                >
                  <div className="mercury-glow"></div>
                </div>
                <div className="threshold-marker-line" style={{ bottom: '50%' }}>
                  <span className="threshold-pill">15% ANOMALY LIMIT</span>
                </div>
              </div>
              <div className="mercury-bulb">
                <div className={`bulb-core ${isAnomalyTriggered ? 'bulb-anomaly' : 'bulb-safe'}`}></div>
              </div>
            </div>

            {/* Readout stats */}
            <div className="thermometer-stats-column">
              <div className="gauge-score-box">
                <span className="score-label">CURRENT ROLLING MORTALITY</span>
                <div className="score-number-row">
                  <span className={`score-digit ${isAnomalyTriggered ? 'text-rose' : rollingMortalityRate > 10 ? 'text-amber' : 'text-emerald'}`}>
                    {rollingMortalityRate.toFixed(1)}%
                  </span>
                  <span className="score-status-badge">
                    {isAnomalyTriggered ? '⚠️ ANOMALY TRIGGERED' : '✅ WITHIN SAFE LIMITS'}
                  </span>
                </div>
              </div>

              <div className="closed-cases-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Total Successful Discharges:</span>
                  <span className="breakdown-val text-emerald font-mono">{totalDischarged} Patients</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Total Mortality Outcomes:</span>
                  <span className="breakdown-val text-rose font-mono">{totalDeceased} Patients</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Total Completed Dispositions:</span>
                  <span className="breakdown-val font-mono">{totalClosedCases} Cohort Cases</span>
                </div>
              </div>

              <div className="gauge-explainer-box">
                <Activity size={16} className="text-cyan" />
                <span>
                  Mathematical tracking gauge updates instantaneously whenever an attending physician logs a discharge or mortality event.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bed Turnaround Velocity Management */}
        <div className="admin-turnaround-card">
          <div className="turnaround-card-header">
            <div>
              <div className="gauge-label-pill">FACILITY LOGISTICS</div>
              <h3 className="turnaround-card-title">Bed Turnaround Velocity & Sanitization</h3>
            </div>
            <span className="live-beds-tag">
              {dischargePendingRooms.length + bedTurnoverRooms.length} Pending Turnover
            </span>
          </div>

          <div className="turnaround-list">
            {dischargePendingRooms.length === 0 && bedTurnoverRooms.length === 0 ? (
              <div className="no-pending-turnover">
                <CheckCircle2 size={32} className="text-emerald" />
                <p>All discharge beds sanitized and turnover complete.</p>
              </div>
            ) : (
              <>
                {dischargePendingRooms.map(p => (
                  <div key={p.id} className="turnover-item pending-cleaning">
                    <div className="turnover-item-header">
                      <div className="room-info">
                        <span className="turnover-room-pill">{p.room}</span>
                        <strong className="turnover-patient">{p.name}</strong>
                      </div>
                      <span className="status-turnover-alert animate-pulse">
                        <Bell size={12} /> Awaiting Cleaning Dispatch
                      </span>
                    </div>
                    <div className="turnover-meta">
                      Discharged by Attending Physician • Room ready for terminal sanitization
                    </div>
                    <div className="turnover-action-row">
                      <button 
                        className="btn-start-cleaning"
                        onClick={() => handleStartCleaning(p.id)}
                      >
                        <Bed size={15} /> Dispatch Environmental Team (Start Cleaning)
                      </button>
                    </div>
                  </div>
                ))}

                {bedTurnoverRooms.map(p => (
                  <div key={p.id} className="turnover-item in-progress-cleaning">
                    <div className="turnover-item-header">
                      <div className="room-info">
                        <span className="turnover-room-pill bg-cyan">{p.room}</span>
                        <strong className="turnover-patient">{p.name}</strong>
                      </div>
                      <span className="status-cleaning-live">
                        <RotateCcw size={12} className="spin-slow" /> Sanitization in Progress
                      </span>
                    </div>
                    <div className="turnover-meta">
                      Terminal UV-C decontamination and linens reset underway.
                    </div>
                    <div className="turnover-action-row">
                      <button 
                        className="btn-complete-cleaning"
                        onClick={() => handleCompleteSanitization(p.id)}
                      >
                        <CheckCircle size={15} /> Mark Sanitized & Bed Available
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Quick Available Beds Summary */}
          <div className="available-beds-summary">
            <span className="avail-label">Sanitized & Available Beds for Admission ({availableRooms.length}):</span>
            <div className="avail-pill-row">
              {availableRooms.map(r => (
                <span key={r.id} className="avail-room-pill">
                  {r.room} (Ready)
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
