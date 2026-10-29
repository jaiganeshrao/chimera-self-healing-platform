import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Service,
  Incident,
  RecoveryAttempt,
  AuditLog,
  SystemSettings,
  AnalyticsOverview,
  FaultMode,
  TestServiceState,
  RecoveryActionType,
} from './types';

import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { FaultSimulatorBanner } from './components/FaultSimulatorBanner';
import { OverviewView } from './components/OverviewView';
import { ServicesView } from './components/ServicesView';
import { IncidentsView } from './components/IncidentsView';
import { DiagnosisView } from './components/DiagnosisView';
import { RecoveryView } from './components/RecoveryView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { RegisterServiceModal } from './components/RegisterServiceModal';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { FaultAlertToast, FaultNotification } from './components/FaultAlertToast';
import { soundAlert } from './utils/soundAlert';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [recoveryAttempts, setRecoveryAttempts] = useState<RecoveryAttempt[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [testState, setTestState] = useState<TestServiceState | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [detailModalIncident, setDetailModalIncident] = useState<Incident | null>(null);

  // Fault Alert & Sound State
  const [notifications, setNotifications] = useState<FaultNotification[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundAlert.getMuted());

  // Tracking refs to guarantee exactly 1 alert and sound per fault occurrence
  const knownIncidentIdsRef = useRef<Set<string>>(new Set());
  const prevFaultModeRef = useRef<string>('NONE');
  const lastInjectedTimeRef = useRef<number>(0);
  const lastAlertTimeRef = useRef<number>(0);
  const initialLoadRef = useRef<boolean>(true);

  const triggerFaultAlert = useCallback((fault: {
    title: string;
    serviceName: string;
    category?: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    details: string;
    incidentId?: string;
    forceSound?: boolean;
  }) => {
    const now = Date.now();
    // Strictly prevent duplicate notifications within 3.0 seconds for the same fault occurrence
    if (now - lastAlertTimeRef.current < 3000 && !fault.forceSound) {
      return;
    }
    lastAlertTimeRef.current = now;

    // 1. Play synthesized 1.0-second urgent warning sound (soundAlert enforces 3.5s cooldown)
    soundAlert.playFaultSound({ durationMs: 1000, force: fault.forceSound });

    // 2. Dispatch system desktop notification if enabled
    soundAlert.sendSystemNotification(
      `Chimera Alert: ${fault.title}`,
      `${fault.serviceName} - ${fault.details}`
    );

    // 3. Display single floating toast notification
    const newNotif: FaultNotification = {
      id: `notif-${now}-${Math.random().toString(36).slice(2, 7)}`,
      title: fault.title,
      serviceName: fault.serviceName,
      category: fault.category,
      severity: fault.severity || 'CRITICAL',
      details: fault.details,
      timestamp: new Date().toLocaleTimeString(),
      incidentId: fault.incidentId,
    };

    // Exactly 1 alert notification displayed, replacing any older notification
    setNotifications([newNotif]);
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const [
        servicesRes,
        incidentsRes,
        auditRes,
        settingsRes,
        analyticsRes,
        testStateRes,
      ] = await Promise.all([
        fetch('/api/services').then((r) => r.json()).catch(() => []),
        fetch('/api/incidents').then((r) => r.json()).catch(() => []),
        fetch('/api/audit-logs').then((r) => r.json()).catch(() => []),
        fetch('/api/settings').then((r) => r.json()).catch(() => null),
        fetch('/api/analytics/overview').then((r) => r.json()).catch(() => null),
        fetch('/api/test-service/metrics').then((r) => r.json()).catch(() => null),
      ]);

      if (Array.isArray(servicesRes)) setServices(servicesRes);
      if (Array.isArray(auditRes)) setAuditLogs(auditRes);
      if (settingsRes && typeof settingsRes === 'object') setSettings(settingsRes);
      if (analyticsRes && typeof analyticsRes === 'object') setAnalytics(analyticsRes);

      // Process incidents and detect any newly emerging faults
      if (Array.isArray(incidentsRes)) {
        setIncidents(incidentsRes);

        if (initialLoadRef.current) {
          // On baseline load, mark existing incidents as known
          incidentsRes.forEach((inc) => knownIncidentIdsRef.current.add(inc.id));
        } else {
          // Detect newly detected incidents
          for (const inc of incidentsRes) {
            if (!knownIncidentIdsRef.current.has(inc.id)) {
              knownIncidentIdsRef.current.add(inc.id);

              // If this incident is from srv-chimera-controlled and was recently injected by user,
              // it already had its notification and sound on injection — avoid 2nd/3rd duplicate
              const isRecentManualFault =
                inc.serviceId === 'srv-chimera-controlled' &&
                Date.now() - lastInjectedTimeRef.current < 12000;

              if (!isRecentManualFault && ['DETECTED', 'ANALYZING', 'RECOVERING'].includes(inc.status)) {
                triggerFaultAlert({
                  title: `FAULT DETECTED: ${inc.category.replace(/_/g, ' ')}`,
                  serviceName: inc.serviceName,
                  category: inc.category,
                  severity: inc.severity,
                  details: inc.description || inc.suspectedRootCause || 'Service exceeded SLA failure threshold.',
                  incidentId: inc.id,
                });
              }
            }
          }
        }
      }

      // Check test service state transitions
      if (testStateRes && typeof testStateRes === 'object') {
        setTestState(testStateRes);
        const mode = testStateRes.faultMode || 'NONE';

        // Only alert if mode changed externally without manual injection
        const isRecentManual = Date.now() - lastInjectedTimeRef.current < 12000;
        if (
          !initialLoadRef.current &&
          !isRecentManual &&
          mode !== 'NONE' &&
          prevFaultModeRef.current !== mode
        ) {
          triggerFaultAlert({
            title: `FAULT DETECTED: ${mode.replace(/_/g, ' ')}`,
            serviceName: 'Order Processing Service (Controlled Testbed)',
            category: 'FAULT_SIMULATION',
            severity: 'CRITICAL',
            details: `Active fault mode '${mode}' triggered. Autonomous remediation and 20–30s recovery initiated.`,
          });
        }
        prevFaultModeRef.current = mode;
      }

      if (initialLoadRef.current) {
        initialLoadRef.current = false;
      }

      if (Array.isArray(incidentsRes) && incidentsRes.length > 0) {
        const allAttempts: RecoveryAttempt[] = [];
        for (const inc of incidentsRes.slice(0, 10)) {
          const atts = await fetch(`/api/incidents/${inc.id}/recovery-attempts`)
            .then((r) => r.json())
            .catch(() => []);
          if (Array.isArray(atts)) allAttempts.push(...atts);
        }
        setRecoveryAttempts(allAttempts);
      }
    } catch (err) {
      console.warn('Error fetching Chimera data:', err);
    }
  }, [triggerFaultAlert]);

  useEffect(() => {
    fetchAllData();
    const hasActiveHealing =
      incidents.some((inc) =>
        ['DETECTED', 'ANALYZING', 'RECOVERING', 'VERIFYING'].includes(inc.status)
      ) || (testState && testState.faultMode !== 'NONE');

    const interval = setInterval(
      () => {
        fetchAllData();
      },
      hasActiveHealing ? 1500 : 3500
    );
    return () => clearInterval(interval);
  }, [fetchAllData, incidents, testState]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleInjectFault = async (mode: FaultMode) => {
    if (mode !== 'NONE') {
      const faultLabels: Record<FaultMode, string> = {
        NONE: 'None',
        UNAVAILABLE: 'Service Unavailable (503)',
        PROCESS_CRASH: 'Process Crash (HTTP 503)',
        HIGH_LATENCY: 'SLA Latency Timeout (3200ms)',
        ERROR_SPIKE: 'HTTP 500 Cascading Exception Spike',
        HIGH_CPU: 'High CPU Infinite Loop (94%)',
        MEMORY_LEAK: 'Progressive Memory Leak OOM',
        DB_CONNECTION_FAIL: 'Database Pool Exhaustion',
      };

      lastInjectedTimeRef.current = Date.now();
      prevFaultModeRef.current = mode;

      triggerFaultAlert({
        title: `FAULT INJECTED: ${faultLabels[mode] || mode}`,
        serviceName: 'Order Processing Service (Controlled Testbed)',
        category: 'CONTROLLED_SIMULATION',
        severity: 'CRITICAL',
        details: `Fault mode '${mode}' injected. 1-second alarm sounded. Autonomous self-healing pipeline running.`,
        forceSound: true,
      });
    } else {
      prevFaultModeRef.current = 'NONE';
    }

    await fetch('/api/test-service/inject-fault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    await fetchAllData();
  };

  const handleResetTestService = async () => {
    await fetch('/api/test-service/reset', { method: 'POST' });
    await fetchAllData();
  };

  const handleRegisterService = async (serviceData: {
    name: string;
    description: string;
    healthCheckUrl: string;
    tags: string[];
  }) => {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register service');
    }
    await fetchAllData();
  };

  const handleTriggerRecovery = async (
    incident: Incident,
    action?: RecoveryActionType
  ) => {
    const actionToRun = action || incident.recommendedAction;
    const res = await fetch(`/api/incidents/${incident.id}/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionToRun }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Recovery trigger failed');
    }

    await fetchAllData();
  };

  const handleUpdateSettings = async (newSettings: Partial<SystemSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (!res.ok) throw new Error('Failed to update system settings');
    const updated = await res.json();
    setSettings(updated);
    await fetchAllData();
  };

  // Test sound function for user immediate testing
  const handleTestSound = () => {
    triggerFaultAlert({
      title: 'TEST FAULT ALERT (1s Sound Verified)',
      serviceName: 'Audio & Telemetry System',
      category: 'AUDIO_VERIFICATION',
      severity: 'MEDIUM',
      details: '1.0-second dual-frequency warning tone generated via Web Audio API. Audio context and visual toast verified.',
      forceSound: true,
    });
  };

  const handleToggleMute = () => {
    const next = soundAlert.toggleMuted();
    setIsMuted(next);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNavigateToIncidentFromToast = (incidentId?: string) => {
    if (!incidentId) {
      setCurrentTab('incidents');
      return;
    }
    const inc = incidents.find((i) => i.id === incidentId);
    if (inc) {
      setDetailModalIncident(inc);
    } else {
      setCurrentTab('incidents');
    }
  };

  const controlledIncident = incidents.find(
    (i) =>
      i.serviceId === 'srv-chimera-controlled' &&
      ['DETECTED', 'ANALYZING', 'RECOVERING', 'VERIFYING'].includes(i.status)
  );

  const controlledAttempt = recoveryAttempts.find(
    (a) =>
      a.serviceId === 'srv-chimera-controlled' &&
      (a.result === 'PENDING' || (controlledIncident && a.incidentId === controlledIncident.id))
  );

  const latestRecoveredControlledIncident = incidents.find(
    (i) => i.serviceId === 'srv-chimera-controlled' && i.status === 'RECOVERED'
  );

  const activeIncidentsCount = incidents.filter((i) =>
    ['DETECTED', 'ANALYZING', 'RECOVERING', 'VERIFYING'].includes(i.status)
  ).length;

  return (
    <div className="flex h-screen bg-[#080D1A] ambient-background text-slate-100 font-sans antialiased overflow-hidden selection:bg-sky-500/30 selection:text-white">
      {/* Floating Real-Time Fault Alert Notifications */}
      <FaultAlertToast
        notifications={notifications}
        onDismiss={handleDismissNotification}
        onNavigateToIncident={handleNavigateToIncidentFromToast}
        onNavigateToSimulator={() => setCurrentTab('simulator')}
      />

      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeIncidentsCount={activeIncidentsCount}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          currentTab={currentTab}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          onOpenSimulator={() => setCurrentTab('simulator')}
          autoRecoveryEnabled={settings?.autoRecoveryEnabled ?? true}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onTestSound={handleTestSound}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentTab === 'simulator' && (
            <FaultSimulatorBanner
              testState={testState}
              activeIncident={controlledIncident}
              activeAttempt={controlledAttempt}
              latestRecoveredIncident={latestRecoveredControlledIncident}
              onInjectFault={handleInjectFault}
              onReset={handleResetTestService}
            />
          )}

          {currentTab === 'overview' && (testState?.faultMode !== 'NONE' || controlledIncident) && (
            <FaultSimulatorBanner
              testState={testState}
              activeIncident={controlledIncident}
              activeAttempt={controlledAttempt}
              latestRecoveredIncident={latestRecoveredControlledIncident}
              onInjectFault={handleInjectFault}
              onReset={handleResetTestService}
            />
          )}

          {currentTab === 'overview' && (
            <OverviewView
              analytics={analytics}
              services={services}
              incidents={incidents}
              auditLogs={auditLogs}
              onSelectService={() => setCurrentTab('services')}
              onSelectIncident={(inc) => {
                setDetailModalIncident(inc);
              }}
              onGoToIncidents={() => setCurrentTab('incidents')}
              onGoToServices={() => setCurrentTab('services')}
            />
          )}

          {currentTab === 'services' && (
            <ServicesView
              services={services}
              onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
              onRefresh={handleManualRefresh}
            />
          )}

          {currentTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              onSelectIncident={(inc) => setDetailModalIncident(inc)}
              onTriggerRecovery={handleTriggerRecovery}
            />
          )}

          {currentTab === 'diagnosis' && (
            <DiagnosisView
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={setSelectedIncident}
              onGoToRecovery={() => setCurrentTab('recovery')}
            />
          )}

          {currentTab === 'recovery' && (
            <RecoveryView
              recoveryAttempts={recoveryAttempts}
              incidents={incidents}
              onTriggerManualRecovery={async (incId, action) => {
                const found = incidents.find((i) => i.id === incId);
                if (found) await handleTriggerRecovery(found, action);
              }}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView overview={analytics} incidents={incidents} />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </main>
      </div>

      <RegisterServiceModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegister={handleRegisterService}
      />

      <IncidentDetailModal
        incident={detailModalIncident}
        onClose={() => setDetailModalIncident(null)}
        onTriggerRecovery={handleTriggerRecovery}
        onNavigateToDiagnosis={(inc) => {
          setSelectedIncident(inc);
          setCurrentTab('diagnosis');
        }}
      />
    </div>
  );
}
