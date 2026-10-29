import {
  IncidentCategory,
  IncidentSeverity,
  DiagnosticMethod,
  RecoveryActionType,
} from '../src/types/index.ts';

export interface DiagnosticInput {
  serviceId: string;
  serviceName: string;
  httpStatus: number;
  responseTimeMs: number;
  cpuUsagePct: number;
  memoryUsagePct: number;
  consecutiveFailures: number;
  errorMessage?: string;
  responseBody?: any;
}

export interface DiagnosticResult {
  category: IncidentCategory;
  severity: IncidentSeverity;
  description: string;
  confirmedFacts: string[];
  suspectedRootCause: string;
  diagnosticMethod: DiagnosticMethod;
  mlConfidence: number | null;
  featureContributions: { feature: string; impactPct: number }[];
  recommendedAction: RecoveryActionType;
}

export function ruleBasedDiagnose(input: DiagnosticInput): DiagnosticResult {
  const confirmedFacts: string[] = [];

  if (input.httpStatus > 0) {
    confirmedFacts.push(`Observed HTTP Status Code: ${input.httpStatus}`);
  } else {
    confirmedFacts.push('Connection failed: Network timeout or unreachable host');
  }

  confirmedFacts.push(`Response time measured at ${input.responseTimeMs}ms`);
  confirmedFacts.push(`Resource telemetry: CPU ${input.cpuUsagePct}%, Memory ${input.memoryUsagePct}%`);
  confirmedFacts.push(`Consecutive failed health-check probes: ${input.consecutiveFailures}`);

  if (input.errorMessage) {
    confirmedFacts.push(`Captured error signature: "${input.errorMessage}"`);
  }

  const isDbError =
    input.errorMessage?.toLowerCase().includes('pool') ||
    input.errorMessage?.toLowerCase().includes('database') ||
    input.errorMessage?.toLowerCase().includes('connection') ||
    (input.responseBody?.error && String(input.responseBody.error).includes('DATABASE'));

  if (isDbError) {
    return {
      category: 'DATABASE_CONNECTIVITY_FAILURE',
      severity: 'HIGH',
      description: 'Service failed due to database connection pool starvation or backend database timeout.',
      confirmedFacts,
      suspectedRootCause:
        'PostgreSQL connection pool exhausted. Active worker threads holding leased connections without returning them to the pool.',
      diagnosticMethod: 'RULE_BASED',
      mlConfidence: 0.94,
      featureContributions: [
        { feature: 'Error signature match (pool/database)', impactPct: 52 },
        { feature: 'HTTP 500 status code', impactPct: 28 },
        { feature: 'Consecutive probe failures', impactPct: 20 },
      ],
      recommendedAction: 'CLEAR_CACHE_RESET_POOL',
    };
  }

  if (
    input.httpStatus === 503 ||
    input.httpStatus === 0 ||
    input.errorMessage?.toLowerCase().includes('crash') ||
    input.errorMessage?.toLowerCase().includes('econnrefused')
  ) {
    return {
      category: 'SERVICE_CRASH',
      severity: 'CRITICAL',
      description: 'Host process or container exited unexpectedly, rejecting socket connections.',
      confirmedFacts,
      suspectedRootCause:
        'Uncaught fatal exception or process termination (SIGSEGV/SIGTERM) resulting in closed TCP socket.',
      diagnosticMethod: 'RULE_BASED',
      mlConfidence: 0.97,
      featureContributions: [
        { feature: 'HTTP 503 / socket termination', impactPct: 60 },
        { feature: 'Zero process responsiveness', impactPct: 25 },
        { feature: 'Probe failure streak', impactPct: 15 },
      ],
      recommendedAction: 'RESTART_SERVICE',
    };
  }

  if (input.responseTimeMs >= 2900 || input.httpStatus === 504) {
    return {
      category: 'REQUEST_TIMEOUT',
      severity: 'HIGH',
      description: 'Response latency exceeded the configured 3000ms SLA tolerance threshold.',
      confirmedFacts,
      suspectedRootCause:
        'Thread pool starvation or upstream I/O bottleneck causing request pipeline queueing.',
      diagnosticMethod: 'RULE_BASED',
      mlConfidence: 0.89,
      featureContributions: [
        { feature: 'Response latency > SLA (3000ms)', impactPct: 58 },
        { feature: 'Degraded throughput', impactPct: 24 },
        { feature: 'Consecutive slow probes', impactPct: 18 },
      ],
      recommendedAction: 'RESET_CIRCUIT_BREAKER',
    };
  }

  if (input.cpuUsagePct >= 80 || input.memoryUsagePct >= 85) {
    const isCpu = input.cpuUsagePct >= 80;
    return {
      category: 'HIGH_RESOURCE_USAGE',
      severity: isCpu ? 'HIGH' : 'CRITICAL',
      description: `Service telemetry breached resource threshold: ${isCpu ? `CPU at ${input.cpuUsagePct}%` : `Memory at ${input.memoryUsagePct}%`}.`,
      confirmedFacts,
      suspectedRootCause: isCpu
        ? 'Compute-bound loop or runaway regex algorithm monopolizing worker CPU cores.'
        : 'Continuous heap allocation or uncollected cache references leading to memory saturation.',
      diagnosticMethod: 'RULE_BASED',
      mlConfidence: 0.92,
      featureContributions: [
        { feature: isCpu ? 'Sustained CPU > 80%' : 'Sustained Memory > 85%', impactPct: 62 },
        { feature: 'Sub-nominal latency', impactPct: 22 },
        { feature: 'Threshold breach', impactPct: 16 },
      ],
      recommendedAction: isCpu ? 'SCALE_WORKER_THREAD' : 'RESTART_SERVICE',
    };
  }

  if (input.httpStatus >= 500) {
    return {
      category: 'HTTP_ERROR_SPIKE',
      severity: 'MEDIUM',
      description: 'Repeated internal server errors encountered during health check evaluation.',
      confirmedFacts,
      suspectedRootCause:
        'Unhandled application exception in order dispatch logic or broken upstream contract.',
      diagnosticMethod: 'RULE_BASED',
      mlConfidence: 0.85,
      featureContributions: [
        { feature: 'HTTP 500 response', impactPct: 50 },
        { feature: 'Error recurrence', impactPct: 30 },
        { feature: 'Nominal CPU/memory', impactPct: 20 },
      ],
      recommendedAction: 'RETRY_TRANSIENT_OPERATION',
    };
  }

  return {
    category: 'SERVICE_CRASH',
    severity: 'MEDIUM',
    description: 'Anomalous behavior observed without exact rule match.',
    confirmedFacts,
    suspectedRootCause: 'Transient network partition or non-standard fault state.',
    diagnosticMethod: 'RULE_BASED',
    mlConfidence: null,
    featureContributions: [{ feature: 'General anomaly', impactPct: 100 }],
    recommendedAction: 'RESTART_SERVICE',
  };
}

export function mlDiagnose(input: DiagnosticInput): DiagnosticResult {
  const ruleResult = ruleBasedDiagnose(input);

  const normLatency = Math.min(1.0, input.responseTimeMs / 4000);
  const normFailures = Math.min(1.0, input.consecutiveFailures / 5);
  const normCpu = input.cpuUsagePct / 100;
  const normMemory = input.memoryUsagePct / 100;
  const is503OrCrash = input.httpStatus === 503 || input.httpStatus === 0 ? 1.0 : 0.0;
  const is500 = input.httpStatus === 500 ? 1.0 : 0.0;
  const isDb = input.errorMessage?.toLowerCase().includes('database') || input.errorMessage?.toLowerCase().includes('pool') ? 1.0 : 0.0;

  const scores = {
    SERVICE_CRASH: 3.5 * is503OrCrash + 1.2 * normFailures + 0.4 * normLatency,
    REQUEST_TIMEOUT: 4.2 * normLatency + 1.0 * normFailures - 0.5 * is503OrCrash,
    HIGH_RESOURCE_USAGE: 3.8 * normCpu + 3.5 * normMemory,
    DATABASE_CONNECTIVITY_FAILURE: 4.5 * isDb + 2.0 * is500 + 0.8 * normFailures,
    HTTP_ERROR_SPIKE: 2.8 * is500 + 1.2 * normFailures - 1.5 * isDb,
  };

  const categories = Object.keys(scores) as IncidentCategory[];
  const expScores = categories.map((c) => Math.exp(scores[c]));
  const sumExp = expScores.reduce((acc, v) => acc + v, 0);
  const probs: Record<IncidentCategory, number> = {} as any;
  categories.forEach((c, i) => {
    probs[c] = expScores[i] / sumExp;
  });

  let bestCategory: IncidentCategory = 'SERVICE_CRASH';
  let highestProb = 0;
  for (const cat of categories) {
    if (probs[cat] > highestProb) {
      highestProb = probs[cat];
      bestCategory = cat;
    }
  }

  const confidence = Math.round(highestProb * 100) / 100;

  return {
    ...ruleResult,
    category: bestCategory,
    diagnosticMethod: 'HYBRID_ENSEMBLE',
    mlConfidence: confidence >= 0.65 ? confidence : null,
  };
}
