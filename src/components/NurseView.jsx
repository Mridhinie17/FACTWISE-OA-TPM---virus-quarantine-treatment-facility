import React, { useState } from 'react';
import { 
  Thermometer, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  Volume2, 
  VolumeX, 
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

  // Unchecked rooms bubble to the top, sorted by clinical urgency (CRITICAL > HIGH > NORMAL)
  const sortedPatients = [...patients].sort((a, b) => {
    const isAUrgent = a.state === PATIENT_STATES.AWAITING_TEMP;
    const isBUrgent = b.state === PATIENT_STATES.AWAITING_TEMP;

    if (isAUrgent && !isBUrgent) return -1;
    if (!isAUrgent && isBUrgent) return 1;

    if (isAUrgent && isBUrgent) {
      const urgencyRank = { CRITICAL: 3, HIGH: 2, NORMAL: 1 };
      return (urgencyRank[b.urgency] || 0) - (urgencyRank[a.urgency] || 0);
    }

    return 0;
  });

  const uncheckedCount = patients.filter(p => p.state === PATIENT_STATES.AWAITING_TEMP).length;
  const lockedCount = patients.filter(p => p.state !== PATIENT_STATES.AWAITING_TEMP).length;

  const quickTempPresets = [
    { label: '97.8°F Normal', value: 97.8 },
    { label: '98.6°F Optimal', value: 98.6 },
    { label: '99.5°F Elevated', value: 99.5 },
    { label: '101.4°F Fever', value: 101.4 },
    { label: '103.2°F High', value: 103.2 },
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
      {/* Top Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Nurse Station</h2>
          <span className="view-badge">Morning Vitals</span>
        </div>

        <div className="metrics-summary-row">
          <div className="stat-pill stat-pill-pending">
            <span className="stat-pill-num">{uncheckedCount}</span>
            <span className="stat-pill-label">Awaiting Temp</span>
          </div>
          <div className="stat-pill stat-pill-done">
            <span className="stat-pill-num">{lockedCount}</span>
            <span className="stat-pill-label">Logged & Locked</span>
          </div>
          <button 
            className="sound-toggle-btn"
            onClick={() => {
              setSoundMuted(!soundMuted);
              soundFx.muted = !soundMuted;
            }}
            title={soundMuted ? 'Sound Muted' : 'Sound Enabled'}
          >
            {soundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{soundMuted ? 'Muted' : 'Audio'}</span>
          </button>
        </div>
      </div>

      {lastLockedRoom && (
        <div className="lockout-notice-banner">
          <ShieldAlert size={18} className="text-amber" />
          <span>
            <strong>Lockout Guard Active:</strong> {lastLockedRoom} vitals are already recorded and locked.
          </span>
          <button className="notice-close" onClick={() => setLastLockedRoom(null)}>✕</button>
        </div>
      )}

      {/* Patient Cards Stream */}
      <div className="patient-cards-stream">
        <div className="stream-header">
          <h3>Patient Rooms ({patients.length})</h3>
          <span className="sort-indicator">Prioritizing Unchecked Rooms</span>
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
                    <span className="patient-meta">{patient.age}y {patient.gender}</span>
                  </div>

                  <div className="card-status-badges">
                    {isAwaitingTemp ? (
                      <span className={`urgency-badge ${isCritical ? 'badge-critical' : isHigh ? 'badge-high' : 'badge-normal'}`}>
                        {patient.urgency}
                      </span>
                    ) : (
                      <span className="lockout-badge">
                        <Lock size={12} /> Locked
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
                      <Thermometer size={16} className="text-forest" />
                      <span>Record Temperature</span>
                    </div>
                    <ChevronRight size={18} className="cue-arrow" />
                  </div>
                ) : (
                  <div className="nurse-card-locked-footer">
                    <div className="locked-vitals">
                      <CheckCircle2 size={16} className="text-forest" />
                      <span>Recorded: <strong>{patient.temperature}°F</strong></span>
                      <span className="log-stamp">• {patient.tempLoggedAt} by {patient.tempLoggedBy}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Temperature Entry Drawer */}
      {selectedPatient && (
        <div className="drawer-backdrop" onClick={() => setSelectedPatientId(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-handle"></div>

            <div className="drawer-patient-header">
              <div>
                <span className="drawer-room-pill">{selectedPatient.room}</span>
                <h3 className="drawer-patient-name">{selectedPatient.name}</h3>
                <p className="drawer-patient-diag">{selectedPatient.diagnosis}</p>
              </div>
              <button 
                className="drawer-close-btn"
                onClick={() => setSelectedPatientId(null)}
              >
                ✕
              </button>
            </div>

            {/* Temperature Readout Card */}
            <div className="temperature-readout-card">
              <span className="temp-dial-label">Body Temperature</span>
              <div className="oversized-temp-value">
                <span className={`big-digits ${tempValue >= 100.4 ? 'text-rose' : tempValue >= 99.5 ? 'text-amber' : 'text-forest'}`}>
                  {tempValue.toFixed(1)}
                </span>
                <span className="temp-unit">°F</span>
              </div>
              <div className="clinical-interpretation">
                {tempValue >= 103.0 ? (
                  <span className="status-pill status-critical">High Fever</span>
                ) : tempValue >= 100.4 ? (
                  <span className="status-pill status-fever">Fever</span>
                ) : tempValue >= 99.5 ? (
                  <span className="status-pill status-mild">Elevated</span>
                ) : (
                  <span className="status-pill status-norm">Normal</span>
                )}
              </div>

              {/* Adjust Stepper */}
              <div className="stepper-controls">
                <button 
                  className="step-btn" 
                  onClick={() => handleAdjustTemp(-0.5)}
                  aria-label="Decrease by 0.5"
                >
                  -0.5°
                </button>
                <button 
                  className="step-btn" 
                  onClick={() => handleAdjustTemp(-0.1)}
                  aria-label="Decrease by 0.1"
                >
                  -0.1°
                </button>
                <button 
                  className="step-btn" 
                  onClick={() => handleAdjustTemp(0.1)}
                  aria-label="Increase by 0.1"
                >
                  +0.1°
                </button>
                <button 
                  className="step-btn" 
                  onClick={() => handleAdjustTemp(0.5)}
                  aria-label="Increase by 0.5"
                >
                  +0.5°
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="quick-presets-section">
              <span className="presets-label">Quick Values:</span>
              <div className="presets-grid">
                {quickTempPresets.map((preset) => (
                  <button
                    key={preset.value}
                    className={`preset-btn ${Math.abs(tempValue - preset.value) < 0.05 ? 'active-preset' : ''}`}
                    onClick={() => handleSetPreset(preset.value)}
                  >
                    <span className="preset-val">{preset.value}°F</span>
                    <span className="preset-name">{preset.label.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nurse Attendant Selection */}
            <div className="attendant-row">
              <label htmlFor="nurse-select">Attendant:</label>
              <select 
                id="nurse-select"
                value={nurseName}
                onChange={(e) => setNurseName(e.target.value)}
                className="attendant-select"
              >
                <option value="Nurse Kelly (RN)">Nurse Kelly (RN)</option>
                <option value="Nurse Martinez (RN)">Nurse Martinez (RN)</option>
                <option value="Nurse Davis (RN)">Nurse Davis (RN)</option>
              </select>
            </div>

            {/* One-Tap Lock Button */}
            <div className="drawer-action-row">
              <button
                className="confirm-lock-btn"
                onClick={() => handleSubmitTemp(selectedPatient.id)}
              >
                <Lock size={18} />
                <span>Confirm & Lock Vitals</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
