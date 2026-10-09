import React, { useState } from 'react';
import { 
  Thermometer, 
  Lock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles, 
  Zap, 
  Volume2, 
  VolumeX, 
  Flame, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { soundFx } from '../utils/soundFx';
import { PATIENT_STATES } from '../data/initialPatients';

export default function NurseView({ 
  patients, 
  onRecordTemp, 
  onBlockedDoubleDip,
  soundMuted,
  setSoundMuted 
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [tempValue, setTempValue] = useState(98.6);
  const [nurseName, setNurseName] = useState('Nurse Kelly (RN)');
  const [lastLockedRoom, setLastLockedRoom] = useState(null);

  // Smart Route Queue:
  // Unchecked rooms (AWAITING_TEMP) bubble to the top, sorted by clinical urgency (CRITICAL > HIGH > NORMAL)
  // Checked rooms sink to the bottom and lock.
  const sortedPatients = [...patients].sort((a, b) => {
    const isAUrgent = a.state === PATIENT_STATES.AWAITING_TEMP;
    const isBUrgent = b.state === PATIENT_STATES.AWAITING_TEMP;

    if (isAUrgent && !isBUrgent) return -1;
    if (!isAUrgent && isBUrgent) return 1;

    // Sub-sort by urgency level if both are awaiting temp
    if (isAUrgent && isBUrgent) {
      const urgencyRank = { CRITICAL: 3, HIGH: 2, NORMAL: 1 };
      return (urgencyRank[b.urgency] || 0) - (urgencyRank[a.urgency] || 0);
    }

    return 0;
  });

  const uncheckedCount = patients.filter(p => p.state === PATIENT_STATES.AWAITING_TEMP).length;
  const lockedCount = patients.filter(p => p.state !== PATIENT_STATES.AWAITING_TEMP).length;

  const quickTempPresets = [
    { label: '97.8°F Normal (Low)', value: 97.8, color: 'preset-cyan' },
    { label: '98.6°F Optimal', value: 98.6, color: 'preset-emerald' },
    { label: '99.5°F Low-Grade', value: 99.5, color: 'preset-amber' },
    { label: '101.4°F Pyrexia', value: 101.4, color: 'preset-orange' },
    { label: '103.2°F High Fever', value: 103.2, color: 'preset-rose' },
  ];

  const handleSelectPatient = (patient) => {
    if (patient.state !== PATIENT_STATES.AWAITING_TEMP) {
      soundFx.playWarning();
      onBlockedDoubleDip(patient.id);
      setLastLockedRoom(patient.room);
      return;
    }
    soundFx.playTap();
    setSelectedPatientId(patient.id);
    setTempValue(98.6);
  };

  const handleAdjustTemp = (delta) => {
    soundFx.playTap();
    setTempValue((prev) => {
      const updated = Math.round((prev + delta) * 10) / 10;
      return Math.min(106.0, Math.max(94.0, updated));
    });
  };

  const handleSetPreset = (val) => {
    soundFx.playTap();
    setTempValue(val);
  };

  const handleSubmitTemp = (patientId) => {
    soundFx.playLockoutSuccess();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    onRecordTemp(patientId, tempValue, nurseName, timeStr);
    setSelectedPatientId(null);
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="nurse-container">
      {/* Top Banner / Ergonomic Context */}
      <div className="role-subhead">
        <div className="role-badge-row">
          <span className="nurse-role-pill">
            <span className="pulse-indicator"></span>
            ROLE 01: NURSE ATTENDING
          </span>
          <span className="thumb-speed-badge">
            <Zap size={14} /> Single-Thumb PPE Speed
          </span>
        </div>

        <div className="queue-metric-bar">
          <div className="metric-box">
            <span className="metric-label">Smart Queue (Needs Temp)</span>
            <span className="metric-val text-amber">{uncheckedCount} Rooms</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Lockout Guarded</span>
            <span className="metric-val text-emerald">{lockedCount} Locked</span>
          </div>
          <button 
            className="sound-toggle-btn"
            onClick={() => {
              setSoundMuted(!soundMuted);
              soundFx.muted = !soundMuted;
            }}
            title={soundMuted ? 'Sound Muted' : 'Sound Enabled'}
          >
            {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{soundMuted ? 'Muted' : 'Audio On'}</span>
          </button>
        </div>
      </div>

      {/* Info callout explaining the role engineering */}
      <div className="role-engineering-card">
        <div className="role-card-icon">
          <ShieldCheck size={20} className="text-emerald" />
        </div>
        <div className="role-card-text">
          <strong>Smart Route Queue & Lockout Guard:</strong>
          <span> Unchecked rooms bubble up by clinical urgency. Once submitted, the room card turns green & locks permanently, eliminating redundant re-testing by passing hall nurses.</span>
        </div>
      </div>

      {lastLockedRoom && (
        <div className="double-dip-toast animate-bounce">
          <ShieldAlert size={18} className="text-amber" />
          <span>
            <strong>Lockout Guard Active:</strong> {lastLockedRoom} vitals already secured. Redundant re-check prevented!
          </span>
          <button className="toast-dismiss" onClick={() => setLastLockedRoom(null)}>×</button>
        </div>
      )}

      {/* Smart Route Queue List */}
      <div className="patient-cards-stream">
        <div className="stream-header">
          <h3>
            Smart Route Queue <span className="stream-counter">({patients.length} Rooms)</span>
          </h3>
          <span className="sorting-hint">Sorted: Urgency & Unchecked First</span>
        </div>

        <div className="cards-list">
          {sortedPatients.map((patient) => {
            const isAwaitingTemp = patient.state === PATIENT_STATES.AWAITING_TEMP;
            const isSelected = patient.id === selectedPatientId;
            const isCritical = patient.urgency === 'CRITICAL';
            const isHigh = patient.urgency === 'HIGH';

            return (
              <div
                key={patient.id}
                className={`nurse-card ${isAwaitingTemp ? 'awaiting-temp-card' : 'locked-card'} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectPatient(patient)}
              >
                <div className="nurse-card-header">
                  <div className="room-title-group">
                    <span className="room-number">{patient.room}</span>
                    <span className="patient-name">{patient.name}</span>
                    <span className="patient-meta">({patient.age}y {patient.gender})</span>
                  </div>

                  <div className="card-status-badges">
                    {isAwaitingTemp ? (
                      <span className={`urgency-badge ${isCritical ? 'badge-critical' : isHigh ? 'badge-high' : 'badge-normal'}`}>
                        {isCritical && <Flame size={12} />}
                        {patient.urgency} URGENCY
                      </span>
                    ) : (
                      <span className="lockout-badge">
                        <Lock size={12} /> LOCKED
                      </span>
                    )}
                  </div>
                </div>

                <div className="patient-diagnosis">
                  {patient.diagnosis}
                </div>

                {isAwaitingTemp ? (
                  <div className="nurse-card-action-cue">
                    <div className="tap-cue">
                      <Thermometer size={16} className="text-amber" />
                      <span>TAP TO RECORD MORNING TEMPERATURE</span>
                    </div>
                    <ChevronRight size={18} className="cue-arrow" />
                  </div>
                ) : (
                  <div className="nurse-card-locked-footer">
                    <div className="locked-vitals">
                      <CheckCircle2 size={16} className="text-emerald" />
                      <span>Vitals: <strong>{patient.temperature}°F</strong></span>
                      <span className="log-stamp">• Logged at {patient.tempLoggedAt} by {patient.tempLoggedBy}</span>
                    </div>
                    <div className="zero-double-dip-tag">
                      <Lock size={11} /> Zero Double-Dipping Active
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ergonomic Single-Thumb Drawer / Overlay for One-Tap Temperature Entry */}
      {selectedPatient && (
        <div className="single-thumb-drawer-backdrop" onClick={() => setSelectedPatientId(null)}>
          <div 
            className="single-thumb-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-handle"></div>

            <div className="drawer-patient-header">
              <div>
                <span className="drawer-room-pill">{selectedPatient.room}</span>
                <h2 className="drawer-patient-name">{selectedPatient.name}</h2>
                <p className="drawer-patient-diag">{selectedPatient.diagnosis}</p>
              </div>
              <button 
                className="drawer-close-btn"
                onClick={() => setSelectedPatientId(null)}
              >
                ✕
              </button>
            </div>

            {/* Oversized Temperature Display */}
            <div className="temperature-readout-card">
              <div className="temp-dial-label">
                <Thermometer size={20} className={tempValue >= 100.4 ? 'text-rose' : 'text-cyan'} />
                <span>MORNING CORE TEMPERATURE</span>
              </div>
              <div className="oversized-temp-value">
                <span className={`big-digits ${tempValue >= 100.4 ? 'text-rose' : tempValue >= 99.5 ? 'text-amber' : 'text-cyan'}`}>
                  {tempValue.toFixed(1)}
                </span>
                <span className="temp-unit">°F</span>
              </div>
              <div className="clinical-interpretation">
                {tempValue >= 103.0 ? (
                  <span className="status-pill status-critical">⚠️ Severe Hyperpyrexia Protocol</span>
                ) : tempValue >= 100.4 ? (
                  <span className="status-pill status-fever">🔥 Febrile State (Fever)</span>
                ) : tempValue >= 99.5 ? (
                  <span className="status-pill status-mild">🟡 Low-Grade Elevation</span>
                ) : (
                  <span className="status-pill status-norm">🟢 Normothermic (Normal Range)</span>
                )}
              </div>

              {/* Stepper Controls for Single-Thumb Micro-Adjustments */}
              <div className="single-thumb-stepper">
                <button 
                  className="thumb-step-btn" 
                  onClick={() => handleAdjustTemp(-0.5)}
                  aria-label="Decrease temperature by 0.5"
                >
                  -0.5°
                </button>
                <button 
                  className="thumb-step-btn" 
                  onClick={() => handleAdjustTemp(-0.1)}
                  aria-label="Decrease temperature by 0.1"
                >
                  -0.1°
                </button>
                <span className="stepper-center-dot">•</span>
                <button 
                  className="thumb-step-btn" 
                  onClick={() => handleAdjustTemp(0.1)}
                  aria-label="Increase temperature by 0.1"
                >
                  +0.1°
                </button>
                <button 
                  className="thumb-step-btn" 
                  onClick={() => handleAdjustTemp(0.5)}
                  aria-label="Increase temperature by 0.5"
                >
                  +0.5°
                </button>
              </div>
            </div>

            {/* Oversized Quick-Toggles */}
            <div className="quick-presets-section">
              <span className="presets-label">QUICK TOGGLES (PPE COMPLIANT):</span>
              <div className="presets-grid">
                {quickTempPresets.map((preset) => (
                  <button
                    key={preset.value}
                    className={`preset-btn ${preset.color} ${Math.abs(tempValue - preset.value) < 0.05 ? 'active-preset' : ''}`}
                    onClick={() => handleSetPreset(preset.value)}
                  >
                    <span className="preset-val">{preset.value}°F</span>
                    <span className="preset-name">{preset.label.split(' ')[1] || 'Temp'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nurse Signature Selector */}
            <div className="nurse-signature-row">
              <label htmlFor="nurse-select">Logging Attendant:</label>
              <select 
                id="nurse-select"
                value={nurseName}
                onChange={(e) => setNurseName(e.target.value)}
                className="nurse-select-dropdown"
              >
                <option value="Nurse Kelly (RN)">Nurse Kelly (RN) [Badge #4092]</option>
                <option value="Nurse Martinez (RN)">Nurse Martinez (RN) [Badge #3182]</option>
                <option value="Nurse Davis (RN)">Nurse Davis (RN) [Badge #5291]</option>
              </select>
            </div>

            {/* Massive One-Tap Verification & Lockout Action */}
            <div className="bottom-action-zone">
              <button
                className="one-tap-verify-btn"
                onClick={() => handleSubmitTemp(selectedPatient.id)}
              >
                <Lock size={22} className="lock-icon-bounce" />
                <div className="btn-text-stack">
                  <span className="main-action-text">CONFIRM & LOCK VITALS</span>
                  <span className="sub-action-text">Transitions to Doctor Inbox • Locks Hallway Retesting</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
