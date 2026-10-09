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
  RotateCcw, 
  PlusCircle,
  HelpCircle,
  Zap,
  Cross
} from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [historicalStats, setHistoricalStats] = useState(HISTORICAL_STATS);
  const [activeTab, setActiveTab] = useState('NURSE'); // 'NURSE' | 'DOCTOR' | 'ADMIN' | 'ALL_ROLES'
  const [dischargeAlerts, setDischargeAlerts] = useState([
    { id: 'ALT-105', room: 'Room 105', patientName: 'Maria Gonzales', timestamp: '08:05 AM' }
  ]);
  const [duplicateAttemptsBlocked, setDuplicateAttemptsBlocked] = useState(6);
  const [soundMuted, setSoundMuted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

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

  // 2b. Doctor: Complete consult
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

  // 2c. Doctor: Confirm Discharge
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

  // 2d. Doctor: Log Mortality Event
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

  // Test scenarios for reviewer
  const triggerScenario = (scenarioKey) => {
    soundFx.playTap();
    if (scenarioKey === 'SCENARIO_NURSE_TEMP') {
      handleRecordTemp('P-102', 102.4, 'Nurse Kelly (RN)', '07:30 AM');
      setActiveTab('DOCTOR');
    } else if (scenarioKey === 'SCENARIO_CLINICAL_HOLD') {
      handleAddClinicalHold('P-103', 'Labile blood pressure, serial monitoring needed.');
      setActiveTab('DOCTOR');
    } else if (scenarioKey === 'SCENARIO_DISCHARGE_ALERT') {
      handleOrderDischarge('P-103');
      setActiveTab('ADMIN');
    } else if (scenarioKey === 'SCENARIO_ANOMALY_FLAG') {
      setHistoricalStats({
        pastDischarges: 12,
        pastDeceased: 3
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

  // Admit new patient
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
      {/* Clean Light Medical Header with Dark Green Brand */}
      <header className="app-header">
        <div className="header-brand">
          <div className="medical-logo-mark">
            <svg viewBox="0 0 24 24" fill="none" className="cross-svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v16m-8-8h16" />
            </svg>
          </div>
          <div className="brand-text-block">
            <h1 className="brand-title">CareRelay</h1>
            <span className="brand-dept">Clinical Portal</span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="header-actions">
          <button 
            className="btn-header-secondary"
            onClick={() => setShowInfoModal(!showInfoModal)}
            title="Overview & Architecture"
          >
            <HelpCircle size={15} />
            <span>Overview</span>
          </button>

          <button 
            className="btn-header-primary"
            onClick={() => setShowAddModal(true)}
          >
            <PlusCircle size={15} />
            <span>Admit Patient</span>
          </button>

          <button 
            className="btn-header-ghost"
            onClick={() => triggerScenario('RESET')}
            title="Reset prototype data"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Clean Navigation Tabs */}
      <nav className="role-navbar">
        <div className="nav-tabs-group">
          <button
            className={`role-tab ${activeTab === 'NURSE' ? 'active-tab' : ''}`}
            onClick={() => {
              soundFx.playTap();
              setActiveTab('NURSE');
            }}
          >
            <span className="tab-title">Nurse</span>
            <span className="tab-count-tag">
              {patients.filter(p => p.state === PATIENT_STATES.AWAITING_TEMP).length} To Check
            </span>
          </button>

          <button
            className={`role-tab ${activeTab === 'DOCTOR' ? 'active-tab' : ''}`}
            onClick={() => {
              soundFx.playTap();
              setActiveTab('DOCTOR');
            }}
          >
            <span className="tab-title">Doctor</span>
            <span className="tab-count-tag">
              {patients.filter(p => p.state === PATIENT_STATES.AWAITING_DOCTOR || p.state === PATIENT_STATES.EVALUATED).length} Ready
            </span>
          </button>

          <button
            className={`role-tab ${activeTab === 'ADMIN' ? 'active-tab' : ''}`}
            onClick={() => {
              soundFx.playTap();
              setActiveTab('ADMIN');
            }}
          >
            <span className="tab-title">Admin</span>
            <span className="tab-count-tag">
              {dischargeAlerts.length > 0 ? `${dischargeAlerts.length} Alert` : 'Overview'}
            </span>
          </button>

          <button
            className={`role-tab ${activeTab === 'ALL_ROLES' ? 'active-tab' : ''}`}
            onClick={() => {
              soundFx.playTap();
              setActiveTab('ALL_ROLES');
            }}
          >
            <span className="tab-title">All Roles</span>
            <span className="tab-count-tag">Combined</span>
          </button>
        </div>
      </nav>

      {/* Quick Test Scenarios Bar */}
      <div className="scenario-bar">
        <div className="scenario-label">
          <Zap size={14} className="text-forest" />
          <span>Test Scenarios:</span>
        </div>
        <div className="scenario-buttons">
          <button 
            className="scenario-chip"
            onClick={() => triggerScenario('SCENARIO_NURSE_TEMP')}
          >
            1. Log Fever 102.4°F (Room 102)
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
            3. Order Discharge (Room 103)
          </button>
          <button 
            className="scenario-chip chip-anomaly"
            onClick={() => triggerScenario('SCENARIO_ANOMALY_FLAG')}
          >
            4. Mortality Anomaly (&gt;15%)
          </button>
        </div>
      </div>

      {/* Overview Modal */}
      {showInfoModal && (
        <div className="modal-backdrop" onClick={() => setShowInfoModal(false)}>
          <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>System Overview</h3>
              <button className="modal-close-btn" onClick={() => setShowInfoModal(false)}>✕</button>
            </div>
            <div className="modal-body-text">
              <div className="overview-block">
                <h4>Nurse Station</h4>
                <p>Designed for fast one-tap vitals entry. Unchecked rooms bubble to the top. Once confirmed, the room locks to prevent duplicate testing.</p>
              </div>
              <div className="overview-block">
                <h4>Doctor Rounds</h4>
                <p>Physicians view only patients with verified morning vitals. Unchecked rooms show "Awaiting Nurse — Do Not Enter". Doctors can place clinical holds and confirm discharges.</p>
              </div>
              <div className="overview-block">
                <h4>Admin & Operations</h4>
                <p>Real-time notifications for discharge bed cleaning, combined with a dynamic mortality thermometer that flags when rolling mortality exceeds 15%.</p>
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

        {activeTab === 'ALL_ROLES' && (
          <div className="all-roles-split-screen">
            <div className="role-column">
              <div className="column-title-bar">Nurse</div>
              <NurseView
                patients={patients}
                onRecordTemp={handleRecordTemp}
                onBlockedDoubleDip={handleBlockedDoubleDip}
                soundMuted={soundMuted}
                setSoundMuted={setSoundMuted}
              />
            </div>

            <div className="role-column">
              <div className="column-title-bar">Doctor</div>
              <DoctorView
                patients={patients}
                onAddClinicalHold={handleAddClinicalHold}
                onRemoveClinicalHold={handleRemoveClinicalHold}
                onCompleteConsult={handleCompleteConsult}
                onOrderDischarge={handleOrderDischarge}
                onRecordMortality={handleRecordMortality}
              />
            </div>

            <div className="role-column">
              <div className="column-title-bar">Admin</div>
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
              <h3>Admit Patient</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdmitSubmit} className="modal-form">
              <div className="form-group">
                <label>Assigned Room:</label>
                <input
                  type="text"
                  value={newPatientRoom}
                  onChange={(e) => setNewPatientRoom(e.target.value)}
                  placeholder="e.g. Room 109"
                  required
                />
              </div>
              <div className="form-group">
                <label>Patient Name:</label>
                <input
                  type="text"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="e.g. Robert Lewis"
                  required
                />
              </div>
              <div className="form-group">
                <label>Diagnosis / Condition:</label>
                <input
                  type="text"
                  value={newPatientDiagnosis}
                  onChange={(e) => setNewPatientDiagnosis(e.target.value)}
                  placeholder="e.g. Post-op Observation"
                  required
                />
              </div>
              <div className="form-group">
                <label>Urgency Level:</label>
                <select
                  value={newPatientUrgency}
                  onChange={(e) => setNewPatientUrgency(e.target.value)}
                >
                  <option value="CRITICAL">Critical (High Priority)</option>
                  <option value="HIGH">High</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-confirm-admit">
                  Admit Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
