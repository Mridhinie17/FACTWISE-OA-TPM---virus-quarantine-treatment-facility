import React, { useState } from 'react';
import { 
  Stethoscope, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  UserCheck, 
  LogOut, 
  Activity, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  Flame,
  MinusCircle,
  HelpCircle,
  Lock
} from 'lucide-react';
import { soundFx } from '../utils/soundFx';
import { PATIENT_STATES } from '../data/initialPatients';

export default function DoctorView({ 
  patients, 
  onAddClinicalHold, 
  onRemoveClinicalHold,
  onCompleteConsult, 
  onOrderDischarge,
  onRecordMortality
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [holdReasonInput, setHoldReasonInput] = useState('');
  const [consultNotesInput, setConsultNotesInput] = useState('');
  const [showUnloggedSection, setShowUnloggedSection] = useState(true);

  // Ready for Doctor: Patients with morning temp logged (AWAITING_DOCTOR, EVALUATED, DISCHARGE_PENDING)
  const readyPatients = patients.filter(
    p => p.state === PATIENT_STATES.AWAITING_DOCTOR || 
         p.state === PATIENT_STATES.EVALUATED ||
         p.state === PATIENT_STATES.DISCHARGE_PENDING
  );

  // Unready patients: Still awaiting morning temperature
  const unloggedPatients = patients.filter(
    p => p.state === PATIENT_STATES.AWAITING_TEMP
  );

  const handleSelectPatient = (patient) => {
    soundFx.playTap();
    setSelectedPatientId(patient.id);
    setHoldReasonInput(patient.clinicalHoldReason || '');
    setConsultNotesInput(patient.doctorNotes || '');
  };

  const handleToggleHold = (patient) => {
    if (patient.clinicalHold) {
      soundFx.playTap();
      onRemoveClinicalHold(patient.id);
    } else {
      soundFx.playWarning();
      const reason = holdReasonInput.trim() || 'Clinically unstable despite normothermia (Requires serial observation)';
      onAddClinicalHold(patient.id, reason);
    }
  };

  const handleSaveConsult = (patientId) => {
    soundFx.playTap();
    onCompleteConsult(patientId, consultNotesInput);
  };

  const handleDischarge = (patientId) => {
    soundFx.playDischargeAlert();
    onOrderDischarge(patientId);
  };

  const handleMortality = (patientId) => {
    soundFx.playWarning();
    onRecordMortality(patientId);
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="doctor-container">
      {/* Top Banner / Philosophy Header */}
      <div className="role-subhead">
        <div className="role-badge-row">
          <span className="doctor-role-pill">
            <Stethoscope size={16} />
            ROLE 02: ATTENDING PHYSICIAN
          </span>
          <span className="protect-minutes-badge">
            <Clock size={14} /> Zero Wait-Time: Doctor Minutes Protected
          </span>
        </div>

        <div className="queue-metric-bar">
          <div className="metric-box">
            <span className="metric-label">Vitals Ready for Consult</span>
            <span className="metric-val text-cyan">{readyPatients.length} Patients</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Locked / Needs Nurse</span>
            <span className="metric-val text-rose">{unloggedPatients.length} Rooms</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Active Clinical Holds</span>
            <span className="metric-val text-amber">
              {readyPatients.filter(p => p.clinicalHold).length} Flagged
            </span>
          </div>
        </div>
      </div>

      {/* Engineering Callout */}
      <div className="role-engineering-card doctor-card-border">
        <div className="role-card-icon">
          <Activity size={20} className="text-cyan" />
        </div>
        <div className="role-card-text">
          <strong>Protected Attending Workflow:</strong>
          <span> Attending physicians only see rooms with verified morning vitals. Rooms lacking data are barred with "Do Not Enter" shields to eliminate wasted clinician footsteps. Clinical Holds allow instant override for normothermic but decompensating cases.</span>
        </div>
      </div>

      <div className="doctor-split-view">
        {/* Left Column: Physician Inbox */}
        <div className="doctor-inbox-column">
          <div className="column-header">
            <h3>Attending Rounds Inbox</h3>
            <span className="inbox-count-tag">{readyPatients.length} Vitals Secured</span>
          </div>

          <div className="doctor-inbox-list">
            {readyPatients.length === 0 ? (
              <div className="empty-inbox-placeholder">
                <CheckCircle size={32} className="text-emerald" />
                <p>All ready patients have been evaluated or transferred.</p>
              </div>
            ) : (
              readyPatients.map((patient) => {
                const isSelected = patient.id === selectedPatientId;
                const isDischargePending = patient.state === PATIENT_STATES.DISCHARGE_PENDING;
                const isEvaluated = patient.state === PATIENT_STATES.EVALUATED;
                const isFever = patient.temperature >= 100.4;

                return (
                  <div
                    key={patient.id}
                    className={`doctor-patient-card ${isSelected ? 'selected-doctor-card' : ''} ${patient.clinicalHold ? 'card-has-hold' : ''}`}
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <div className="doctor-card-top">
                      <div className="room-and-patient">
                        <span className="doc-room-pill">{patient.room}</span>
                        <strong className="doc-patient-name">{patient.name}</strong>
                      </div>
                      <div className="vitals-display-badge">
                        <span className={`temp-val-badge ${isFever ? 'temp-fever' : 'temp-normal'}`}>
                          {patient.temperature}°F
                        </span>
                      </div>
                    </div>

                    <div className="doc-patient-condition">
                      {patient.diagnosis}
                    </div>

                    <div className="doc-card-footer">
                      <div className="vitals-audit-trail">
                        <span>Logged {patient.tempLoggedAt} by {patient.tempLoggedBy}</span>
                      </div>

                      <div className="status-tags-cluster">
                        {patient.clinicalHold && (
                          <span className="tag-clinical-hold">
                            <ShieldAlert size={12} /> CLINICAL HOLD
                          </span>
                        )}
                        {isDischargePending ? (
                          <span className="tag-discharge-pending">
                            <LogOut size={12} /> DISCHARGE SENT TO ADMIN
                          </span>
                        ) : isEvaluated ? (
                          <span className="tag-evaluated">
                            <UserCheck size={12} /> CONSULTED
                          </span>
                        ) : (
                          <span className="tag-ready-consult">
                            <Stethoscope size={12} /> READY FOR ROUNDS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Explicitly Labeled "Awaiting Nurse - Do Not Enter" Section */}
          <div className="blocked-rooms-section">
            <button 
              className="toggle-blocked-btn"
              onClick={() => setShowUnloggedSection(!showUnloggedSection)}
            >
              <div className="btn-left">
                <ShieldAlert size={16} className="text-rose" />
                <span>BLOCKED ROOMS: AWAITING NURSE VITALS ({unloggedPatients.length})</span>
              </div>
              {showUnloggedSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showUnloggedSection && (
              <div className="blocked-rooms-list">
                {unloggedPatients.length === 0 ? (
                  <div className="all-vitals-in">All morning vitals entered! No blocked rooms.</div>
                ) : (
                  unloggedPatients.map((p) => (
                    <div key={p.id} className="blocked-room-item">
                      <div className="blocked-room-left">
                        <Lock size={14} className="text-rose" />
                        <span className="blocked-room-tag">{p.room}</span>
                        <span className="blocked-patient-name">{p.name} ({p.diagnosis})</span>
                      </div>
                      <div className="blocked-badge-warning">
                        ⚠️ AWAITING NURSE — DO NOT ENTER
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Clinical Evaluation & Override Panel */}
        <div className="doctor-eval-column">
          {selectedPatient ? (
            <div className="eval-detail-sheet">
              <div className="sheet-header">
                <div>
                  <div className="sheet-room-row">
                    <span className="sheet-room-badge">{selectedPatient.room}</span>
                    <span className="sheet-patient-id">{selectedPatient.id}</span>
                  </div>
                  <h2 className="sheet-title">{selectedPatient.name}</h2>
                  <p className="sheet-subtitle">
                    {selectedPatient.age} yo {selectedPatient.gender} • {selectedPatient.diagnosis}
                  </p>
                </div>

                <div className="sheet-vitals-box">
                  <span className="vitals-box-label">VERIFIED VITALS</span>
                  <span className="vitals-box-value">{selectedPatient.temperature}°F</span>
                  <span className="vitals-box-signer">{selectedPatient.tempLoggedBy}</span>
                </div>
              </div>

              {/* Clinical Override / Clinical Hold Feature */}
              <div className={`clinical-hold-control-box ${selectedPatient.clinicalHold ? 'hold-active-box' : ''}`}>
                <div className="hold-header-row">
                  <div className="hold-label-stack">
                    <div className="hold-title-wrap">
                      <ShieldAlert size={18} className={selectedPatient.clinicalHold ? 'text-amber' : 'text-slate-400'} />
                      <h4 className="hold-title">Clinical Override / Clinical Hold</h4>
                    </div>
                    <p className="hold-desc">
                      Flag patient as unstable despite lack of fever (e.g. labile hemodynamics, sepsis prodrome, post-op bleed).
                    </p>
                  </div>

                  <button
                    className={`toggle-override-switch ${selectedPatient.clinicalHold ? 'btn-hold-active' : 'btn-hold-inactive'}`}
                    onClick={() => handleToggleHold(selectedPatient)}
                  >
                    {selectedPatient.clinicalHold ? 'REMOVE CLINICAL HOLD' : '+ ADD CLINICAL HOLD'}
                  </button>
                </div>

                {selectedPatient.clinicalHold && (
                  <div className="hold-active-details animate-fadeIn">
                    <div className="active-hold-badge">
                      ⚠️ CLINICAL HOLD ACTIVE — DISCHARGE BLOCKED UNTIL STABILIZED
                    </div>
                    <label className="hold-input-label">Override Reason / Alert Note:</label>
                    <input
                      type="text"
                      className="hold-input"
                      value={holdReasonInput}
                      onChange={(e) => setHoldReasonInput(e.target.value)}
                      placeholder="Specify instability (e.g. Orthostatic drop, respiratory distress...)"
                    />
                  </div>
                )}
              </div>

              {/* Doctor Consult Notes */}
              <div className="doc-notes-section">
                <label className="notes-label">Attending Clinical Notes & Plan:</label>
                <textarea
                  className="doc-notes-textarea"
                  rows={3}
                  value={consultNotesInput}
                  onChange={(e) => setConsultNotesInput(e.target.value)}
                  placeholder="Enter assessment, lab orders, medication titration, or discharge criteria..."
                />
                <button
                  className="save-notes-btn"
                  onClick={() => handleSaveConsult(selectedPatient.id)}
                >
                  <FileText size={14} /> Complete & Save Assessment
                </button>
              </div>

              {/* Disposition and Handoff Relays */}
              <div className="disposition-relay-box">
                <h4 className="relay-title">Workflow Relay Actions</h4>
                <p className="relay-sub">
                  Protecting hospital capacity and ensuring immediate bed turnaround.
                </p>

                <div className="relay-action-grid">
                  <button
                    className="relay-btn btn-discharge-order"
                    disabled={selectedPatient.clinicalHold || selectedPatient.state === PATIENT_STATES.DISCHARGE_PENDING}
                    onClick={() => handleDischarge(selectedPatient.id)}
                    title={selectedPatient.clinicalHold ? 'Remove Clinical Hold first' : 'Confirm Discharge Order'}
                  >
                    <LogOut size={18} />
                    <div className="btn-stack">
                      <strong>Confirm Discharge Order</strong>
                      <small>Triggers Instant Admin Bed Turnover Alert</small>
                    </div>
                  </button>

                  <button
                    className="relay-btn btn-mortality-record"
                    onClick={() => handleMortality(selectedPatient.id)}
                  >
                    <MinusCircle size={18} />
                    <div className="btn-stack">
                      <strong>Log Mortality Outcome</strong>
                      <small>Recalculates Live Survival Thermometer</small>
                    </div>
                  </button>
                </div>

                {selectedPatient.clinicalHold && (
                  <div className="hold-disclaimer">
                    <AlertCircle size={14} /> Discharge button disabled while Clinical Hold is active.
                  </div>
                )}
                {selectedPatient.state === PATIENT_STATES.DISCHARGE_PENDING && (
                  <div className="discharge-sent-disclaimer">
                    <CheckCircle size={14} /> Discharge confirmed. Terminal bed turnover alert dispatched to Admin!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-selection-panel">
              <Stethoscope size={48} className="text-slate-600" />
              <h3>Select a Patient from Attending Rounds Inbox</h3>
              <p>Only vitals-secured patients appear for rounding. Zero doctor time wasted on missing data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
