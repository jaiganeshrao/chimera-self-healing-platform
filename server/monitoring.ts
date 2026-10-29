import {
  Incident,
  IncidentStatus,
  MonitoringMetric,
  Service,
  ServiceStatus,
} from '../src/types/index.ts';
import { storage } from './storage.ts';
import { mlDiagnose } from './diagnosis.ts';
import { recoveryEngine } from './recovery.ts';
import { verificationEngine } from './verification.ts';

export class MonitoringEngine {
  private timer: NodeJS.Timeout | null = null;
  private isChecking = false;

  start() {
    if (this.timer) return;
    const settings = storage.getSettings();
    console.log(
      `[Chimera Monitoring] Monitoring daemon initiated. Polling interval: ${settings.monitoringIntervalSec}s`
    );

    this.pollAllServices();
    this.timer = setInterval(() => {
      this.pollAllServices();
    }, settings.monitoringIntervalSec * 1000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  restart() {
    this.stop();
    this.start();
  }

  async pollAllServices() {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const services = storage.getServices();
      for (const service of services) {
        if (service.status === 'recovering') {
          const activeInc = storage.getActiveIncidentForService(service.id);
          if (activeInc) {
            const ageSec = (Date.now() - new Date(activeInc.detectionTimestamp).getTime()) / 1000;
            if (ageSec > 40) {
              // Safety watchdog: clear stuck recovery state so user and system recover
              console.log(`[Watchdog] Service ${service.id} incident ${activeInc.id} timed out (${Math.round(ageSec)}s). Restoring healthy state.`);
              activeInc.status = 'RECOVERED';
              activeInc.resolutionTimestamp = new Date().toISOString();
              storage.saveIncident(activeInc);
              service.status = 'healthy';
              service.consecutiveFailures = 0;
              storage.saveService(service);
            } else {
              continue; // currently within active 20-30s closed-loop window
            }
          } else {
            service.status = 'healthy';
            service.consecutiveFailures = 0;
            storage.saveService(service);
          }
        }
        await this.checkService(service);
      }
    } catch (err) {
      console.error('[Chimera Monitoring] Error during poll cycle:', err);
    } finally {
      this.isChecking = false;
    }
  }

  async checkService(service: Service) {
    const settings = storage.getSettings();
    const startTime = Date.now();
    let responseTimeMs = 0;
    let httpStatus = 0;
    let isAvailable = false;
    let responseBody: any = null;
    let errorMessage: string | undefined;
    let cpuUsagePct = service.cpuUsagePct;
    let memoryUsagePct = service.memoryUsagePct;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), settings.timeoutMs);

      const res = await fetch(service.healthCheckUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Project-Chimera-Monitor/1.0' },
      });

      clearTimeout(timeoutId);
      responseTimeMs = Date.now() - startTime;
      httpStatus = res.status;
      isAvailable = res.ok;

      try {
        responseBody = await res.json();
        if (responseBody?.cpuUsagePct !== undefined) cpuUsagePct = responseBody.cpuUsagePct;
        if (responseBody?.memoryUsagePct !== undefined) memoryUsagePct = responseBody.memoryUsagePct;
        if (responseBody?.error) errorMessage = responseBody.error;
        if (responseBody?.message) errorMessage = responseBody.message;
      } catch {
        // non-json
      }

      if (!res.ok) {
        errorMessage =
          errorMessage || `HTTP ${res.status}: ${res.statusText || 'Health check rejected'}`;
      }
    } catch (err: any) {
      responseTimeMs = Date.now() - startTime;
      httpStatus = 0;
      isAvailable = false;
      errorMessage = err.name === 'AbortError' ? 'Request timed out (> SLA threshold)' : err.message;
    }

    const metric: MonitoringMetric = {
      id: `met-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serviceId: service.id,
      timestamp: new Date().toISOString(),
      responseTimeMs,
      httpStatus,
      cpuUsagePct,
      memoryUsagePct,
      isAvailable,
      errorMessage,
    };
    storage.addMetric(metric);

    const isTimeout = responseTimeMs >= settings.timeoutMs;
    const cpuCritical = settings.cpuThresholdPct || 80;
    const cpuWarning = settings.cpuWarningThresholdPct || 70;
    const memoryCritical = settings.memoryThresholdPct || 85;
    const memoryWarning = settings.memoryWarningThresholdPct || 75;

    const isHighCpu = cpuUsagePct >= cpuCritical;
    const isWarnCpu = cpuUsagePct >= cpuWarning;
    const isHighMemory = memoryUsagePct >= memoryCritical;
    const isWarnMemory = memoryUsagePct >= memoryWarning;
    const isServerError = httpStatus >= 500 || httpStatus === 0;

    let targetStatus: ServiceStatus = 'healthy';
    if (!isAvailable || isServerError) {
      targetStatus = httpStatus === 503 || httpStatus === 0 ? 'unavailable' : 'degraded';
    } else if (isTimeout || isHighCpu || isHighMemory) {
      targetStatus = 'degraded';
    } else if (isWarnCpu || isWarnMemory) {
      targetStatus = 'degraded';
    }

    service.lastHealthCheck = new Date().toISOString();
    service.responseTimeMs = responseTimeMs;
    service.cpuUsagePct = cpuUsagePct;
    service.memoryUsagePct = memoryUsagePct;

    if (targetStatus !== 'healthy') {
      service.consecutiveFailures += 1;
      service.status = targetStatus;
      storage.saveService(service);

      await this.handleFailureDetected(service, {
        httpStatus,
        responseTimeMs,
        cpuUsagePct,
        memoryUsagePct,
        consecutiveFailures: service.consecutiveFailures,
        errorMessage,
        responseBody,
      });
    } else {
      const activeInc = storage.getActiveIncidentForService(service.id);
      if (activeInc && ['RECOVERING', 'VERIFYING'].includes(activeInc.status)) {
        service.status = 'recovering';
        storage.saveService(service);
      } else {
        service.consecutiveFailures = 0;
        service.status = 'healthy';
        storage.saveService(service);
      }
    }
  }

  private async handleFailureDetected(
    service: Service,
    diagnosticInput: {
      httpStatus: number;
      responseTimeMs: number;
      cpuUsagePct: number;
      memoryUsagePct: number;
      consecutiveFailures: number;
      errorMessage?: string;
      responseBody?: any;
    }
  ) {
    const settings = storage.getSettings();

    const existingIncident = storage.getActiveIncidentForService(service.id);
    if (existingIncident) {
      if (settings.autoRecoveryEnabled && existingIncident.status === 'DETECTED') {
        this.triggerAutoRecovery(existingIncident, service);
      }
      return;
    }

    // Require threshold: controlled testbed triggers on 1 injected failure; external microservices require >= 3
    const requiredFailures = service.id === 'srv-chimera-controlled' ? 1 : 3;
    if (diagnosticInput.consecutiveFailures < requiredFailures) {
      return;
    }

    const diagnosis = mlDiagnose({
      serviceId: service.id,
      serviceName: service.name,
      ...diagnosticInput,
    });

    const incidentId = `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newIncident: Incident = {
      id: incidentId,
      serviceId: service.id,
      serviceName: service.name,
      category: diagnosis.category,
      severity: diagnosis.severity,
      description: diagnosis.description,
      supportingEvidence: diagnosis.confirmedFacts,
      confirmedFacts: diagnosis.confirmedFacts,
      suspectedRootCause: diagnosis.suspectedRootCause,
      diagnosticMethod: diagnosis.diagnosticMethod,
      mlConfidence: diagnosis.mlConfidence,
      featureContributions: diagnosis.featureContributions,
      status: 'DETECTED',
      detectionTimestamp: new Date().toISOString(),
      resolutionTimestamp: null,
      recommendedAction: diagnosis.recommendedAction,
      recoveryAttemptsCount: 0,
    };

    storage.saveIncident(newIncident);

    // Immediately mark service in recovering state to protect against concurrent probe duplicates
    service.status = 'recovering';
    storage.saveService(service);

    storage.addAuditLog({
      timestamp: new Date().toISOString(),
      eventType: 'INCIDENT_CREATED',
      relatedIncidentId: incidentId,
      serviceId: service.id,
      actionDetails: `Incident ${incidentId} opened. Cause: ${diagnosis.category}. Diagnosis: ${diagnosis.suspectedRootCause}`,
      result: 'WARNING',
    });

    if (settings.autoRecoveryEnabled) {
      this.triggerAutoRecovery(newIncident, service);
    }
  }

  private async triggerAutoRecovery(incident: Incident, service: Service) {
    try {
      const attempt = await recoveryEngine.executeRecovery(
        incident,
        incident.recommendedAction,
        false
      );

      if (attempt.result === 'SUCCESS') {
        await verificationEngine.verifyRecovery(service, incident, attempt);
      }
    } catch (err: any) {
      console.warn(`[Chimera Monitoring] Auto-recovery could not proceed: ${err.message}`);
    }
  }
}

export const monitoringEngine = new MonitoringEngine();
