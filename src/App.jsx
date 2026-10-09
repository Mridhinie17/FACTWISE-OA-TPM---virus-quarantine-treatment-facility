import React, { useState } from 'react';
import NurseView from './components/NurseView';
import DoctorView from './components/DoctorView';
import AdminView from './components/AdminView';
import { 
  INITIAL_PATIENTS, 
  HISTORICAL_STATS, 
  PATIENT_STATES 
} from './data/initialPatients';
import { soundFx } from './utils/soundFx';
import { 
  Activity, 
  UserCheck, 
  Stethoscope, 
  Building2, 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Zap, 
  ShieldCheck, 
  AlertTriangle,
  PlusCircle,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [historicalStats, setHistoricalStats] = useState(HISTORICAL_STATS);
  const [activeTab, setActiveTab] = useState('NURSE'); // 'NURSE' | 'DOCTOR' | 'ADMIN' | 'RELAY_ENGINE'
  const [dischargeAlerts, setDischargeAlerts] = useState([
    { id: 'ALT-105', room: 'Room 105', patientName: 'Maria Gonzales', timestamp: '08:05 AM' }
  ]);
  const [duplicateAttemptsBlocked, setDuplicateAttemptsBlocked] = useState(6);
  const [soundMuted, setSoundMuted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showArchitectureGuide, setShowArchitectureGuide] = useState(false);

  // New patient modal state
  const [newPatientRoom, setNewPatientRoom] = useState('Room 109');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDiagnosis, setNewPatientDiagnosis] = useState('');
  const [newPatientUrgency, setNewPatientUrgency] = useState('HIGH');

  // --- Handlers ---

  // 1. Nurse logs temperature: Transition AWAITING_TEMP -> AWAITING_DOCTOR
  const handleRecordTemp = (patientId, temperature, nurseName, timeStr) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            state: PATIENT_STATES.AWAITING_DOCTOR,
            temperature,
            tempLoggedBy: nurseName,
            tempLoggedAt: timeStr,
            doubleDippingAttemptsBlocked: 0
          };
        }
        return p;
      })
    );
  };

  // 1b. Nurse attempts double dipping on locked room
  const handleBlockedDoubleDip = (patientId) => {
    setDuplicateAttemptsBlocked((c) => c + 1);
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            doubleDippingAttemptsBlocked: (p.doubleDippingAttemptsBlocked || 0) + 1
          };
        }
        return p;
      })
    );
  };

  // 2. Doctor: Clinical Hold toggle
  const handleAddClinicalHold = (patientId, reason) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            clinicalHold: true,
            clinicalHoldReason: reason
          };
        }
        return p;
      })
    );
  };

  const handleRemoveClinicalHold = (patientId) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            clinicalHold: false,
            clinicalHoldReason: ''
          };
        }
        return p;
      })
    );
  };

  // 2b. Doctor: Complete consult / assessment
  const handleCompleteConsult = (patientId, notes) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            state: PATIENT_STATES.EVALUATED,
            doctorNotes: notes,
            doctorEvaluatedAt: timeStr
          };
        }
        return p;
      })
    );
  };

  // 2c. Doctor: Confirm Discharge -> Instant Admin Alert & Transition
  const handleOrderDischarge = (patientId) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const target = patients.find((p) => p.id === patientId);

    if (target) {
      setDischargeAlerts((prev) => [
        ...prev,
        {
          id: `ALT-${Date.now()}`,
          room: target.room,
          patientName: target.name,
          timestamp: timeStr
        }
      ]);
    }

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            state: PATIENT_STATES.DISCHARGE_PENDING,
            outcome: 'DISCHARGED',
            bedTurnoverStartedAt: timeStr
          };
        }
        return p;
      })
    );
  };

  // 2d. Doctor: Log Mortality Event -> Live gauge update
  const handleRecordMortality = (patientId) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            state: PATIENT_STATES.AVAILABLE,
            outcome: 'DECEASED'
          };
        }
        return p;
      })
    );
  };

  // 3. Admin: Dismiss alert
  const handleDismissAlert = (alertId) => {
    setDischargeAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // 3b. Admin: Bed turnover
  const handleTurnoverBed = (patientId, targetState) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          if (targetState === 'CLEANING') {
            return {
              ...p,
              state: PATIENT_STATES.BED_TURNOVER
            };
          }
          if (targetState === 'AVAILABLE') {
            return {
              ...p,
              state: PATIENT_STATES.AVAILABLE,
              outcome: 'DISCHARGED'
            };
          }
        }
        return p;
      })
    );
  };

  // Quick Preset Scenarios for reviewer testing
  const triggerScenario = (scenarioKey) => {
    soundFx.playTap();
    if (scenarioKey === 'SCENARIO_NURSE_TEMP') {
      // Room 102 (Marcus Brody) gets 102.4°F logged
      handleRecordTemp('P-102', 102.4, 'Nurse Kelly (RN)', '07:30 AM');
      setActiveTab('DOCTOR');
    } else if (scenarioKey === 'SCENARIO_CLINICAL_HOLD') {
      // Room 103 gets a Clinical Hold placed
      handleAddClinicalHold('P-103', 'Severe bronchospasm, accessory muscle use noted.');
      setActiveTab('DOCTOR');
    } else if (scenarioKey === 'SCENARIO_DISCHARGE_ALERT') {
      // Room 103 discharged -> triggers Admin Alert
      handleOrderDischarge('P-103');
      setActiveTab('ADMIN');
    } else if (scenarioKey === 'SCENARIO_ANOMALY_FLAG') {
      // Simulate cohort mortality spike to exceed 15%
      setHistoricalStats({
        pastDischarges: 12,
        pastDeceased: 3 // 3 / (12 + 3 + 1) = 4 / 16 = 25% mortality -> triggers Amber Flag!
      });
      setActiveTab('ADMIN');
      soundFx.playWarning();
    } else if (scenarioKey === 'RESET') {
      setPatients(INITIAL_PATIENTS);
      setHistoricalStats(HISTORICAL_STATS);
      setDischargeAlerts([
        { id: 'ALT-105', room: 'Room 105', patientName: 'Maria Gonzales', timestamp: '08:05 AM' }
      ]);
      setDuplicateAttemptsBlocked(6);
    }
  };

  // Handle admit new patient
  const handleAdmitSubmit = (e) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const newId = `P-${Date.now().toString().slice(-4)}`;
    const newEntry = {
      id: newId,
      room: newPatientRoom,
      name: newPatientName,
      age: 48,
      gender: 'M',
      diagnosis: newPatientDiagnosis || 'General Clinical Observation',
      urgency: newPatientUrgency,
      state: PATIENT_STATES.AWAITING_TEMP,
      temperature: null,
      tempLoggedAt: null,
      tempLoggedBy: null,
      clinicalHold: false,
      clinicalHoldReason: '',
      doctorEvaluatedAt: null,
      doctorNotes: '',
      outcome: 'ACTIVE',
      bedTurnoverStartedAt: null,
      doubleDippingAttemptsBlocked: 0
    };

    setPatients((prev) => [newEntry, ...prev]);
    setShowAddModal(false);
    setNewPatientName('');
    setNewPatientDiagnosis('');
    soundFx.playLockoutSuccess();
    setActiveTab('NURSE');
  };

  return (
    <div className="app-shell">
      {/* Top Clinical Nav Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo-ring">
            <Activity size={22} className="logo-pulse" />
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">PULSE RELAY OS</h1>
              <span className="brand-badge">ASYNC RELAY ENGINE</span>
            </div>
            <p className="brand-sub">Eliminating Duplicate Effort • Out-of-Order Visits • Stagnant Beds</p>
          </div>
        </div>

        {/* Global Controls & Test Presets */}
        <div className="header-actions">
          <button 
            className="btn-info-toggle"
            onClick={() => setShowArchitectureGuide(!showArchitectureGuide)}
            title="Architecture Specs"
          >
            <HelpCircle size={16} />
            <span>Architecture Specs</span>
          </button>

          <button 
            className="btn-admit-patient"
            onClick={() => setShowAddModal(true)}
          >
            <PlusCircle size={16} />
            <span>Admit Patient</span>
          </button>

          <button 
            className="btn-reset-demo"
            onClick={() => triggerScenario('RESET')}
            title="Reset to default prototype state"
          >
            <RotateCcw size={15} />
            <span>Reset Demo</span>
          </button>
        </div>
      </header>

      {/* Role Navigation Bar (Seamless switching between the 3 Handoff Roles + Live Simulation) */}
      <nav className="role-navbar">
        <div className="nav-tabs-group">
          <button
            className={`role-nav-tab ${activeTab === 'NURSE' ? 'active-nurse-tab' : ''}`}
            onClick={() => {
              soundFx.playTap();
              setActiveTab('NURSE');
            }}
          >
            <div className="tab-left-col">
              <span className="tab-role-num">ROLE 01</span>
              <span className="tab-role-name">Nurse Attending</span>
            </div>
            <span className="tab-bubble tab-bubble-nurse">
              {patients.filter(p => p.state === PATIENT_STATES.AWAITING_TEMP).length} To Log
            </span>
          </button>

          <button
            className={`role-nav-tab ${activeTab === 'DOCTOR' ? 'active-doctor-tab' : ''}`}
            onClick={() => {
              soundFx.playTap();
              setActiveTab('DOCTOR');
            }}
          >
            <div className="tab-left-col">
              <span className="tab-role-num">ROLE 02</span>
              <span className="tab-role-name">Attending Physician</span>
            </div>
            <span className="tab-bubble tab-bubble-doctor">
              {patients.filter(p => p.state === PATIENT_STATES.AWAITING_DOCTOR || p.state === PATIENT_STATES.EVALUATED).length} Ready
            </span>
          </button>

          <button
            className={`role-nav-tab ${activeTab === 'ADMIN' ? 'active-admin-tab' : ''}`}
            onClick={() => {
              soundFx.playTap();
              setActiveTab('ADMIN');
            }}
          >
            <div className="tab-left-col">
              <span className="tab-role-num">ROLE 03</span>
              <span className="tab-role-name">Admin & Ops</span>
            </div>
            <span className="tab-bubble tab-bubble-admin">
              {dischargeAlerts.length > 0 ? `🔔 ${dischargeAlerts.length} Alert` : 'Guardrails'}
            </span>
          </button>

          <button
            className={`role-nav-tab ${activeTab === 'RELAY_ENGINE' ? 'active-relay-tab' : ''}`}
            onClick={() => {
              soundFx.playTap();
              setActiveTab('RELAY_ENGINE');
            }}
          >
            <div className="tab-left-col">
              <span className="tab-role-num">LIVE RELAY</span>
              <span className="tab-role-name">All 3 Roles Relay</span>
            </div>
            <span className="tab-bubble tab-bubble-relay">
              ⚡ Asynchronous View
            </span>
          </button>
        </div>
      </nav>

      {/* Quick Interactive Testing Bar for OA Reviewers */}
      <div className="scenario-bar">
        <div className="scenario-label">
          <Zap size={14} className="text-cyan" />
          <span>Interactive Prototype Scenarios:</span>
        </div>
        <div className="scenario-buttons">
          <button 
            className="scenario-chip"
            onClick={() => triggerScenario('SCENARIO_NURSE_TEMP')}
          >
            1. Log Fever 102.4°F (Room 102) & Lock
          </button>
          <button 
            className="scenario-chip"
            onClick={() => triggerScenario('SCENARIO_CLINICAL_HOLD')}
          >
            2. Toggle Clinical Hold (Room 103)
          </button>
          <button 
            className="scenario-chip"
            onClick={() => triggerScenario('SCENARIO_DISCHARGE_ALERT')}
          >
            3. Order Discharge → Trigger Admin Alert
          </button>
          <button 
            className="scenario-chip chip-anomaly"
            onClick={() => triggerScenario('SCENARIO_ANOMALY_FLAG')}
          >
            4. Trigger Amber Mortality Anomaly (&gt;15%)
          </button>
        </div>
      </div>

      {/* Architecture Specs Modal / Drawer */}
      {showArchitectureGuide && (
        <div className="guide-modal-backdrop" onClick={() => setShowArchitectureGuide(false)}>
          <div className="guide-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="guide-header">
              <h2>Clinical Handoff Bottleneck Architecture Spec</h2>
              <button className="guide-close-btn" onClick={() => setShowArchitectureGuide(false)}>✕</button>
            </div>
            <div className="guide-body">
              <div className="spec-section">
                <h3>1. User Role: Nurse Attending</h3>
                <p><strong>Design:</strong> Single-thumb operational speed. Nurses carry trays and wear PPE; cannot fiddle with complex nested navigation.</p>
                <ul>
                  <li><strong>Smart route queue:</strong> Patients are sorted not just by room number, but by urgency: unchecked rooms where temperature is needed first thing in the morning bubble to the top.</li>
                  <li><strong>One-tap verification:</strong> Temperature entry interface with oversized quick-toggles and instant audio-haptic feedback.</li>
                  <li><strong>Lockout Guard:</strong> Once submitted, the room card turns green and locks. This prevents redundant re-testing by another nurse patrolling the hall.</li>
                </ul>
              </div>

              <div className="spec-section">
                <h3>2. User Role: The Doctor Attending</h3>
                <p><strong>Design:</strong> Protect doctor minutes. Doctors should never touch a thermometer or wait on data.</p>
                <ul>
                  <li><strong>Inbox filtering:</strong> Shows only patients whose morning temp is already logged.</li>
                  <li><strong>Lockout / Warning:</strong> Any room lacking vitals is explicitly labeled: <em>"Awaiting Nurse - Do Not Enter"</em>.</li>
                  <li><strong>Clinical Override:</strong> If a patient is clinically unstable despite lack of fever, doctor adds a Clinical Hold with one tap.</li>
                </ul>
              </div>

              <div className="spec-section">
                <h3>3. User Role: The Admin</h3>
                <p><strong>Design:</strong> Bed turnaround time and clinical survival guardrails.</p>
                <ul>
                  <li><strong>Instant Discharge Alert:</strong> The moment a doctor confirms discharge, an alert pops up on the admin screen.</li>
                  <li><strong>Dynamic Mortality Thermometer:</strong> Live statistical tracking gauge. If rolling mortality climbs past 15%, system triggers an amber anomaly flag instructing team leads to audit treatment batches.</li>
                </ul>
              </div>

              <div className="spec-section">
                <h3>State Machine Enforcement</h3>
                <p className="state-machine-code">
                  <code>AWAITING_TEMP</code> ➔ <code>AWAITING_DOCTOR</code> ➔ <code>EVALUATED</code> (with Clinical Hold option) ➔ <code>DISCHARGE_PENDING</code> ➔ <code>BED_TURNOVER</code> ➔ <code>AVAILABLE</code>
                </p>
                <p><strong>Zero double dipping:</strong> Once logged, action buttons disable dynamically across all interfaces.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="app-main-viewport">
        {activeTab === 'NURSE' && (
          <NurseView
            patients={patients}
            onRecordTemp={handleRecordTemp}
            onBlockedDoubleDip={handleBlockedDoubleDip}
            soundMuted={soundMuted}
            setSoundMuted={setSoundMuted}
          />
        )}

        {activeTab === 'DOCTOR' && (
          <DoctorView
            patients={patients}
            onAddClinicalHold={handleAddClinicalHold}
            onRemoveClinicalHold={handleRemoveClinicalHold}
            onCompleteConsult={handleCompleteConsult}
            onOrderDischarge={handleOrderDischarge}
            onRecordMortality={handleRecordMortality}
          />
        )}

        {activeTab === 'ADMIN' && (
          <AdminView
            patients={patients}
            historicalStats={historicalStats}
            dischargeAlerts={dischargeAlerts}
            onDismissAlert={handleDismissAlert}
            onTurnoverBed={handleTurnoverBed}
            duplicateAttemptsBlocked={duplicateAttemptsBlocked}
          />
        )}

        {activeTab === 'RELAY_ENGINE' && (
          <div className="relay-split-screen">
            <div className="relay-column">
              <div className="relay-col-title-bar nurse-bar">
                <span>ROLE 01: NURSE ATTENDING</span>
                <small>Single-Thumb Vitals & Lockout</small>
              </div>
              <NurseView
                patients={patients}
                onRecordTemp={handleRecordTemp}
                onBlockedDoubleDip={handleBlockedDoubleDip}
                soundMuted={soundMuted}
                setSoundMuted={setSoundMuted}
              />
            </div>

            <div className="relay-column">
              <div className="relay-col-title-bar doctor-bar">
                <span>ROLE 02: ATTENDING PHYSICIAN</span>
                <small>Protected Minutes & Clinical Override</small>
              </div>
              <DoctorView
                patients={patients}
                onAddClinicalHold={handleAddClinicalHold}
                onRemoveClinicalHold={handleRemoveClinicalHold}
                onCompleteConsult={handleCompleteConsult}
                onOrderDischarge={handleOrderDischarge}
                onRecordMortality={handleRecordMortality}
              />
            </div>

            <div className="relay-column">
              <div className="relay-col-title-bar admin-bar">
                <span>ROLE 03: CLINICAL OPERATIONS & ADMIN</span>
                <small>Bed Turnover & Mortality Thermometer</small>
              </div>
              <AdminView
                patients={patients}
                historicalStats={historicalStats}
                dischargeAlerts={dischargeAlerts}
                onDismissAlert={handleDismissAlert}
                onTurnoverBed={handleTurnoverBed}
                duplicateAttemptsBlocked={duplicateAttemptsBlocked}
              />
            </div>
          </div>
        )}
      </main>

      {/* Admit Patient Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Admit New Patient to Cohort</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdmitSubmit} className="modal-form">
              <div className="form-group">
                <label>Assigned Bed / Room:</label>
                <input
                  type="text"
                  value={newPatientRoom}
                  onChange={(e) => setNewPatientRoom(e.target.value)}
                  placeholder="e.g. Room 109"
                  required
                />
              </div>
              <div className="form-group">
                <label>Patient Full Name:</label>
                <input
                  type="text"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="e.g. Robert Lewis"
                  required
                />
              </div>
              <div className="form-group">
                <label>Clinical Diagnosis / Condition:</label>
                <input
                  type="text"
                  value={newPatientDiagnosis}
                  onChange={(e) => setNewPatientDiagnosis(e.target.value)}
                  placeholder="e.g. Diabetic Ketoacidosis (DKA)"
                  required
                />
              </div>
              <div className="form-group">
                <label>Initial Vitals Urgency:</label>
                <select
                  value={newPatientUrgency}
                  onChange={(e) => setNewPatientUrgency(e.target.value)}
                >
                  <option value="CRITICAL">CRITICAL (Fever / Sepsis Risk)</option>
                  <option value="HIGH">HIGH (Post-op / Priority)</option>
                  <option value="NORMAL">NORMAL (Routine Morning)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-admit-confirm">
                  Confirm Admission to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
