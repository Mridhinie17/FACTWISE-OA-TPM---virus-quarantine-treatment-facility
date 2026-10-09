import React, { useState } from 'react';
import { 
  Stethoscope, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle, 
  UserCheck, 
  LogOut, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  MinusCircle,
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

  // Ready for Doctor: Patients with morning temp logged
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
      const reason = holdReasonInput.trim() || 'Clinically unstable despite normal temperature';
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
      {/* Top Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Doctor Rounds</h2>
          <span className="view-badge">Attending Physician</span>
        </div>

        <div className="metrics-summary-row">
          <div className="stat-pill stat-pill-done">
            <span className="stat-pill-num">{readyPatients.length}</span>
            <span className="stat-pill-label">Ready for Consult</span>
          </div>
          <div className="stat-pill stat-pill-pending">
            <span className="stat-pill-num">{unloggedPatients.length}</span>
            <span className="stat-pill-label">Awaiting Vitals</span>
          </div>
          <div className="stat-pill stat-pill-hold">
            <span className="stat-pill-num">
              {readyPatients.filter(p => p.clinicalHold).length}
            </span>
            <span className="stat-pill-label">Clinical Holds</span>
          </div>
        </div>
      </div>

      <div className="doctor-split-view">
        {/* Left Column: Physician Inbox */}
        <div className="doctor-inbox-column">
          <div className="column-header">
            <h3>Patient Inbox</h3>
            <span className="badge-count">{readyPatients.length} Verified</span>
          </div>

          <div className="doctor-inbox-list">
            {readyPatients.length === 0 ? (
              <div className="empty-box">
                <CheckCircle size={28} className="text-forest" />
                <p>No patients currently pending evaluation.</p>
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
                    className={`doctor-patient-card ${isSelected ? 'selected' : ''} ${patient.clinicalHold ? 'has-hold' : ''}`}
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <div className="doctor-card-top">
                      <div>
                        <span className="room-label">{patient.room}</span>
                        <h4 className="patient-name">{patient.name}</h4>
                      </div>
                      <span className={`temp-badge ${isFever ? 'temp-fever' : 'temp-normal'}`}>
                        {patient.temperature}°F
                      </span>
                    </div>

                    <div className="patient-condition">
                      {patient.diagnosis}
                    </div>

                    <div className="doctor-card-bottom">
                      <span className="vitals-meta">
                        {patient.tempLoggedAt} • {patient.tempLoggedBy}
                      </span>

                      <div className="status-badges">
                        {patient.clinicalHold && (
                          <span className="badge-hold">Clinical Hold</span>
                        )}
                        {isDischargePending ? (
                          <span className="badge-discharged">Discharge Sent</span>
                        ) : isEvaluated ? (
                          <span className="badge-consulted">Consulted</span>
                        ) : (
                          <span className="badge-ready">Ready</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Blocked Rooms Section (Awaiting Nurse) */}
          <div className="blocked-rooms-container">
            <button 
              className="blocked-toggle-header"
              onClick={() => setShowUnloggedSection(!showUnloggedSection)}
            >
              <div className="header-left">
                <ShieldAlert size={16} className="text-amber" />
                <span>Rooms Awaiting Vitals ({unloggedPatients.length})</span>
              </div>
              {showUnloggedSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showUnloggedSection && (
              <div className="blocked-rooms-list">
                {unloggedPatients.length === 0 ? (
                  <div className="empty-subtext">All morning vitals recorded.</div>
                ) : (
                  unloggedPatients.map((p) => (
                    <div key={p.id} className="blocked-room-row">
                      <div className="room-info">
                        <Lock size={13} className="text-muted" />
                        <strong>{p.room}</strong>
                        <span>{p.name}</span>
                      </div>
                      <span className="blocked-warning-tag">
                        Awaiting Nurse — Do Not Enter
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Clinical Evaluation & Controls */}
        <div className="doctor-eval-column">
          {selectedPatient ? (
            <div className="eval-detail-sheet">
              <div className="sheet-header">
                <div>
                  <span className="sheet-room-tag">{selectedPatient.room}</span>
                  <h3 className="sheet-patient-title">{selectedPatient.name}</h3>
                  <p className="sheet-patient-meta">
                    {selectedPatient.age}y {selectedPatient.gender} • {selectedPatient.diagnosis}
                  </p>
                </div>

                <div className="sheet-vitals-box">
                  <span className="vitals-label">Temperature</span>
                  <span className="vitals-number">{selectedPatient.temperature}°F</span>
                  <span className="vitals-by">{selectedPatient.tempLoggedBy}</span>
                </div>
              </div>

              {/* Clinical Hold Toggle */}
              <div className={`clinical-hold-card ${selectedPatient.clinicalHold ? 'hold-active' : ''}`}>
                <div className="hold-header">
                  <div>
                    <h4>Clinical Hold</h4>
                    <p className="hold-hint">Flag patient as unstable to prevent premature discharge.</p>
                  </div>
                  <button
                    className={`hold-toggle-btn ${selectedPatient.clinicalHold ? 'btn-remove-hold' : 'btn-add-hold'}`}
                    onClick={() => handleToggleHold(selectedPatient)}
                  >
                    {selectedPatient.clinicalHold ? 'Remove Hold' : 'Add Clinical Hold'}
                  </button>
                </div>

                {selectedPatient.clinicalHold && (
                  <div className="hold-form">
                    <label>Reason for Hold:</label>
                    <input
                      type="text"
                      value={holdReasonInput}
                      onChange={(e) => setHoldReasonInput(e.target.value)}
                      placeholder="e.g. Labile blood pressure, serial labs pending..."
                      className="hold-input-field"
                    />
                  </div>
                )}
              </div>

              {/* Physician Notes */}
              <div className="physician-notes-card">
                <label>Clinical Notes & Orders:</label>
                <textarea
                  rows={3}
                  value={consultNotesInput}
                  onChange={(e) => setConsultNotesInput(e.target.value)}
                  placeholder="Enter physician assessment, orders, and treatment plan..."
                  className="notes-textarea"
                />
                <button
                  className="btn-save-assessment"
                  onClick={() => handleSaveConsult(selectedPatient.id)}
                >
                  <FileText size={14} /> Save Assessment
                </button>
              </div>

              {/* Disposition Actions */}
              <div className="disposition-card">
                <h4>Disposition</h4>
                <div className="disposition-buttons">
                  <button
                    className="btn-order-discharge"
                    disabled={selectedPatient.clinicalHold || selectedPatient.state === PATIENT_STATES.DISCHARGE_PENDING}
                    onClick={() => handleDischarge(selectedPatient.id)}
                  >
                    <LogOut size={16} />
                    <span>Order Discharge</span>
                  </button>

                  <button
                    className="btn-log-mortality"
                    onClick={() => handleMortality(selectedPatient.id)}
                  >
                    <MinusCircle size={16} />
                    <span>Record Mortality</span>
                  </button>
                </div>

                {selectedPatient.clinicalHold && (
                  <p className="disposition-notice notice-hold">
                    <AlertCircle size={13} /> Discharge is blocked while Clinical Hold is active.
                  </p>
                )}
                {selectedPatient.state === PATIENT_STATES.DISCHARGE_PENDING && (
                  <p className="disposition-notice notice-success">
                    <CheckCircle size={13} /> Discharge confirmed. Bed turnover alert sent to Admin.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-selection-card">
              <Stethoscope size={40} className="text-forest-light" />
              <h4>Select a Patient</h4>
              <p>Choose a patient with verified vitals from the inbox to begin rounds.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
