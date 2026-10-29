import fs from 'fs';
import path from 'path';
import {
  Service,
  Incident,
  RecoveryAttempt,
  MonitoringMetric,
  AuditLog,
  SystemSettings,
  AnalyticsOverview,
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'chimera_db.json');

interface DatabaseSchema {
  services: Service[];
  incidents: Incident[];
  recoveryAttempts: RecoveryAttempt[];
  metrics: MonitoringMetric[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const defaultSettings: SystemSettings = {
  monitoringIntervalSec: 4,
  timeoutMs: 3000,
  errorRateThresholdPct: 25,
  cpuWarningThresholdPct: 70,
  cpuThresholdPct: 80,
  memoryWarningThresholdPct: 75,
  memoryThresholdPct: 85,
  maxRecoveryAttempts: 3,
  recoveryCooldownSec: 25,
  autoRecoveryEnabled: true,
  verificationProbesCount: 5,
  allowedHosts: ['localhost', '127.0.0.1', 'ais-dev', '0.0.0.0'],
};

const initialServices: Service[] = [
  {
    id: 'srv-chimera-controlled',
    name: 'Order Processing Test Service',
    description: 'Controlled target test application with fault injection and self-healing hooks',
    healthCheckUrl: 'http://localhost:3000/api/test-service/health',
    status: 'healthy',
    registrationDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    lastHealthCheck: new Date().toISOString(),
    consecutiveFailures: 0,
    responseTimeMs: 32,
    cpuUsagePct: 18,
    memoryUsagePct: 42,
    tags: ['core-pipeline', 'e-commerce', 'testbed'],
  },
  {
    id: 'srv-payment-gateway',
    name: 'Payment Gateway Proxy',
    description: 'Simulated payment authorization and token exchange service',
    healthCheckUrl: 'http://localhost:3000/api/test-service/health?target=payment',
    status: 'healthy',
    registrationDate: new Date(Date.now() - 3600000 * 48).toISOString(),
    lastHealthCheck: new Date().toISOString(),
    consecutiveFailures: 0,
    responseTimeMs: 45,
    cpuUsagePct: 24,
    memoryUsagePct: 51,
    tags: ['financial', 'pci-dss', 'proxy'],
  },
  {
    id: 'srv-inventory-sync',
    name: 'Inventory Sync Worker',
    description: 'Background stock reconciliation and warehouse cache daemon',
    healthCheckUrl: 'http://localhost:3000/api/test-service/health?target=inventory',
    status: 'healthy',
    registrationDate: new Date(Date.now() - 3600000 * 72).toISOString(),
    lastHealthCheck: new Date().toISOString(),
    consecutiveFailures: 0,
    responseTimeMs: 64,
    cpuUsagePct: 35,
    memoryUsagePct: 58,
    tags: ['inventory', 'event-stream'],
  },
];

class StorageEngine {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const services: Service[] = parsed.services || initialServices;
        const incidents: Incident[] = parsed.incidents || [];

        // Safety self-heal on load: any incident stuck in active phases for > 45s is auto-resolved
        const now = Date.now();
        for (const inc of incidents) {
          if (['DETECTED', 'ANALYZING', 'RECOVERING', 'VERIFYING'].includes(inc.status)) {
            const ageSec = Math.round((now - new Date(inc.detectionTimestamp).getTime()) / 1000);
            if (ageSec > 45) {
              inc.status = 'RECOVERED';
              inc.resolutionTimestamp = inc.resolutionTimestamp || new Date().toISOString();
            }
          }
        }
        for (const s of services) {
          if (s.status === 'recovering') {
            s.status = 'healthy';
            s.consecutiveFailures = 0;
          }
        }

        return {
          services,
          incidents,
          recoveryAttempts: parsed.recoveryAttempts || [],
          metrics: parsed.metrics || [],
          auditLogs: parsed.auditLogs || [],
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
        };
      }
    } catch (err) {
      console.warn('[Storage] Error loading persistent file, using initial data:', err);
    }

    return {
      services: initialServices,
      incidents: [],
      recoveryAttempts: [],
      metrics: [],
      auditLogs: [
        {
          id: 'audit-init-01',
          timestamp: new Date().toISOString(),
          eventType: 'SETTINGS_UPDATED',
          relatedIncidentId: null,
          serviceId: null,
          actionDetails: 'Storage engine initialized with baseline reliability policies',
          result: 'INFO',
        },
      ],
      settings: defaultSettings,
    };
  }

  private persist() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (this.data.metrics.length > 500) {
          this.data.metrics = this.data.metrics.slice(-500);
        }
        if (this.data.auditLogs.length > 300) {
          this.data.auditLogs = this.data.auditLogs.slice(-300);
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (err) {
        console.error('[Storage] Error writing database file:', err);
      } finally {
        this.saveTimeout = null;
      }
    }, 1000);
  }

  // --- Services ---
  getServices(): Service[] {
    return [...this.data.services];
  }

  getServiceById(id: string): Service | undefined {
    return this.data.services.find((s) => s.id === id);
  }

  saveService(service: Service): Service {
    const idx = this.data.services.findIndex((s) => s.id === service.id);
    if (idx >= 0) {
      this.data.services[idx] = service;
    } else {
      this.data.services.push(service);
    }
    this.persist();
    return service;
  }

  // --- Incidents ---
  getIncidents(limit = 100): Incident[] {
    return [...this.data.incidents]
      .sort((a, b) => new Date(b.detectionTimestamp).getTime() - new Date(a.detectionTimestamp).getTime())
      .slice(0, limit);
  }

  getIncidentById(id: string): Incident | undefined {
    return this.data.incidents.find((inc) => inc.id === id);
  }

  getActiveIncidentForService(serviceId: string): Incident | undefined {
    return this.data.incidents.find(
      (inc) =>
        inc.serviceId === serviceId &&
        ['DETECTED', 'ANALYZING', 'RECOVERING', 'VERIFYING'].includes(inc.status)
    );
  }

  saveIncident(incident: Incident): Incident {
    const idx = this.data.incidents.findIndex((i) => i.id === incident.id);
    if (idx >= 0) {
      this.data.incidents[idx] = incident;
    } else {
      this.data.incidents.unshift(incident);
    }
    this.persist();
    return incident;
  }

  clearActiveIncidentsForService(serviceId: string, reason = 'RESOLVED'): void {
    const nowIso = new Date().toISOString();
    for (const inc of this.data.incidents) {
      if (
        inc.serviceId === serviceId &&
        ['DETECTED', 'ANALYZING', 'RECOVERING', 'VERIFYING'].includes(inc.status)
      ) {
        inc.status = 'RECOVERED';
        inc.resolutionTimestamp = nowIso;
      }
    }
    const service = this.getServiceById(serviceId);
    if (service) {
      service.status = 'healthy';
      service.consecutiveFailures = 0;
    }
    this.persist();
  }

  // --- Recovery Attempts ---
  getRecoveryAttempts(incidentId?: string): RecoveryAttempt[] {
    const list = incidentId
      ? this.data.recoveryAttempts.filter((a) => a.incidentId === incidentId)
      : this.data.recoveryAttempts;
    return [...list].sort(
      (a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime()
    );
  }

  getRecentRecoveryAttemptsForService(serviceId: string, windowSeconds = 60): RecoveryAttempt[] {
    const cutoff = Date.now() - windowSeconds * 1000;
    return this.data.recoveryAttempts.filter(
      (a) => a.serviceId === serviceId && new Date(a.startTimestamp).getTime() >= cutoff
    );
  }

  saveRecoveryAttempt(attempt: RecoveryAttempt): RecoveryAttempt {
    const idx = this.data.recoveryAttempts.findIndex((a) => a.id === attempt.id);
    if (idx >= 0) {
      this.data.recoveryAttempts[idx] = attempt;
    } else {
      this.data.recoveryAttempts.unshift(attempt);
    }
    this.persist();
    return attempt;
  }

  // --- Metrics ---
  getMetrics(serviceId?: string, limit = 100): MonitoringMetric[] {
    const list = serviceId
      ? this.data.metrics.filter((m) => m.serviceId === serviceId)
      : this.data.metrics;
    return list.slice(-limit);
  }

  addMetric(metric: MonitoringMetric): void {
    this.data.metrics.push(metric);
    this.persist();
  }

  // --- Audit Logs ---
  getAuditLogs(limit = 100): AuditLog[] {
    return [...this.data.auditLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  addAuditLog(entry: Omit<AuditLog, 'id'>): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    this.data.auditLogs.unshift(log);
    this.persist();
    return log;
  }

  // --- Settings ---
  getSettings(): SystemSettings {
    return { ...this.data.settings };
  }

  updateSettings(newSettings: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.persist();
    return { ...this.data.settings };
  }

  // --- Analytics Overview ---
  getAnalyticsOverview(): AnalyticsOverview {
    const services = this.data.services;
    const incidents = this.data.incidents;
    const attempts = this.data.recoveryAttempts;

    const healthyServices = services.filter((s) => s.status === 'healthy').length;
    const degradedServices = services.filter((s) => s.status === 'degraded').length;
    const unavailableServices = services.filter((s) => s.status === 'unavailable').length;
    const recoveringServices = services.filter((s) => s.status === 'recovering').length;

    const activeIncidents = incidents.filter((i) =>
      ['DETECTED', 'ANALYZING', 'RECOVERING', 'VERIFYING', 'REQUIRES_HUMAN_INTERVENTION'].includes(i.status)
    ).length;

    const successfulRecoveries = attempts.filter((a) => a.result === 'SUCCESS' && a.verified).length;
    const failedRecoveries = attempts.filter((a) => a.result === 'FAILED' || a.result === 'TIMED_OUT').length;
    const totalAttempted = successfulRecoveries + failedRecoveries;
    const recoverySuccessRate =
      totalAttempted > 0 ? Math.round((successfulRecoveries / totalAttempted) * 100) : 100;

    const resolved = incidents.filter((i) => i.status === 'RECOVERED' && i.resolutionTimestamp);
    let totalRecoverySec = 0;
    for (const inc of resolved) {
      if (inc.resolutionTimestamp) {
        const diff =
          (new Date(inc.resolutionTimestamp).getTime() - new Date(inc.detectionTimestamp).getTime()) / 1000;
        if (diff > 0 && diff < 3600) {
          totalRecoverySec += diff;
        }
      }
    }
    const meanTimeToRecoverySec =
      resolved.length > 0 ? Math.round(totalRecoverySec / resolved.length) : 18;

    const avgResponseTime =
      services.length > 0
        ? Math.round(services.reduce((acc, s) => acc + s.responseTimeMs, 0) / services.length)
        : 0;

    return {
      totalServices: services.length,
      healthyServices,
      degradedServices,
      unavailableServices,
      recoveringServices,
      activeIncidents,
      totalIncidentsAllTime: incidents.length,
      successfulRecoveries,
      failedRecoveries,
      recoverySuccessRate,
      meanTimeToRecoverySec,
      averageResponseTimeMs: avgResponseTime,
    };
  }
}

export const storage = new StorageEngine();
