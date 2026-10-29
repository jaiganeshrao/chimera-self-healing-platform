export type ServiceStatus = 'healthy' | 'degraded' | 'unavailable' | 'recovering';

export type IncidentCategory =
  | 'SERVICE_CRASH'
  | 'REQUEST_TIMEOUT'
  | 'HIGH_RESOURCE_USAGE'
  | 'DATABASE_CONNECTIVITY_FAILURE'
  | 'HTTP_ERROR_SPIKE';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'DETECTED'
  | 'ANALYZING'
  | 'RECOVERING'
  | 'VERIFYING'
  | 'RECOVERED'
  | 'RECOVERY_FAILED'
  | 'REQUIRES_HUMAN_INTERVENTION';

export type DiagnosticMethod = 'RULE_BASED' | 'ML_CLASSIFICATION' | 'HYBRID_ENSEMBLE';

export type RecoveryActionType =
  | 'RESTART_SERVICE'
  | 'RETRY_TRANSIENT_OPERATION'
  | 'CLEAR_CACHE_RESET_POOL'
  | 'SCALE_WORKER_THREAD'
  | 'RESET_CIRCUIT_BREAKER';

export type RecoveryResult = 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMED_OUT' | 'SKIPPED_COOLDOWN';

export interface Service {
  id: string;
  name: string;
  description: string;
  healthCheckUrl: string;
  status: ServiceStatus;
  registrationDate: string;
  lastHealthCheck: string;
  consecutiveFailures: number;
  responseTimeMs: number;
  cpuUsagePct: number;
  memoryUsagePct: number;
  tags: string[];
}

export interface Incident {
  id: string;
  serviceId: string;
  serviceName: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  description: string;
  supportingEvidence: string[];
  confirmedFacts: string[];
  suspectedRootCause: string;
  diagnosticMethod: DiagnosticMethod;
  mlConfidence: number | null;
  featureContributions?: { feature: string; impactPct: number }[];
  status: IncidentStatus;
  detectionTimestamp: string;
  resolutionTimestamp: string | null;
  recommendedAction: RecoveryActionType;
  recoveryAttemptsCount: number;
}

export interface RecoveryAttempt {
  id: string;
  incidentId: string;
  serviceId: string;
  recoveryAction: RecoveryActionType;
  attemptNumber: number;
  startTimestamp: string;
  endTimestamp: string | null;
  result: RecoveryResult;
  errorDetails: string | null;
  verified: boolean;
  verificationDetails?: {
    probesCount: number;
    passedCount: number;
    responseTimeMs: number;
  };
}

export interface MonitoringMetric {
  id: string;
  serviceId: string;
  timestamp: string;
  responseTimeMs: number;
  httpStatus: number;
  cpuUsagePct: number;
  memoryUsagePct: number;
  isAvailable: boolean;
  errorMessage?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType:
    | 'HEALTH_CHECK_FAIL'
    | 'INCIDENT_CREATED'
    | 'DIAGNOSIS_COMPLETED'
    | 'RECOVERY_TRIGGERED'
    | 'RECOVERY_STAGE'
    | 'RECOVERY_COMPLETED'
    | 'VERIFICATION_PASSED'
    | 'VERIFICATION_FAILED'
    | 'SETTINGS_UPDATED'
    | 'SERVICE_REGISTERED'
    | 'FAULT_INJECTED'
    | 'MANUAL_OVERRIDE';
  relatedIncidentId: string | null;
  serviceId: string | null;
  actionDetails: string;
  result: 'SUCCESS' | 'FAILURE' | 'INFO' | 'WARNING';
}

export interface SystemSettings {
  monitoringIntervalSec: number;
  timeoutMs: number;
  errorRateThresholdPct: number;
  cpuWarningThresholdPct?: number;
  cpuThresholdPct: number;
  memoryWarningThresholdPct?: number;
  memoryThresholdPct: number;
  maxRecoveryAttempts: number;
  recoveryCooldownSec: number;
  autoRecoveryEnabled: boolean;
  verificationProbesCount: number;
  allowedHosts: string[];
}

export type FaultMode =
  | 'NONE'
  | 'UNAVAILABLE'
  | 'PROCESS_CRASH'
  | 'HIGH_LATENCY'
  | 'ERROR_SPIKE'
  | 'HIGH_CPU'
  | 'MEMORY_LEAK'
  | 'DB_CONNECTION_FAIL';

export interface TestServiceState {
  faultMode: FaultMode;
  injectedAt: string | null;
  faultMessage: string;
  restartCount: number;
  lastRestartAt: string | null;
  processUptimeSec: number;
  simulatedCpuUsage: number;
  simulatedMemoryUsage: number;
}

export interface AnalyticsOverview {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unavailableServices: number;
  recoveringServices: number;
  activeIncidents: number;
  totalIncidentsAllTime: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  recoverySuccessRate: number;
  meanTimeToRecoverySec: number;
  averageResponseTimeMs: number;
}
