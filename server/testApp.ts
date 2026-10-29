import express, { Request, Response } from 'express';
import { FaultMode, TestServiceState } from '../src/types/index.ts';
import { storage } from './storage.ts';

const router = express.Router();

let testState: TestServiceState = {
  faultMode: 'NONE',
  injectedAt: null,
  faultMessage: 'Running nominally in standard container sandbox',
  restartCount: 0,
  lastRestartAt: null,
  processUptimeSec: 1240,
  simulatedCpuUsage: 18,
  simulatedMemoryUsage: 42,
};

setInterval(() => {
  if (testState.faultMode === 'NONE') {
    testState.simulatedCpuUsage = Math.floor(15 + Math.random() * 12);
    testState.simulatedMemoryUsage = Math.floor(40 + Math.random() * 8);
    testState.processUptimeSec += 3;
  } else if (testState.faultMode === 'HIGH_CPU') {
    testState.simulatedCpuUsage = Math.floor(88 + Math.random() * 10);
  } else if (testState.faultMode === 'MEMORY_LEAK') {
    testState.simulatedMemoryUsage = Math.min(98, testState.simulatedMemoryUsage + 2);
  }
}, 3000);

export function getTestServiceState(): TestServiceState {
  return { ...testState };
}

type FaultInjectedHandler = (mode: FaultMode) => void;
let onFaultInjectedHandler: FaultInjectedHandler | null = null;

export function setOnFaultInjected(handler: FaultInjectedHandler) {
  onFaultInjectedHandler = handler;
}

export function restartTestService(action = 'RESTART_SERVICE', clearIncidents = false): { success: boolean; message: string } {
  testState.faultMode = 'NONE';
  testState.faultMessage = `Service successfully restarted via ${action} policy`;
  testState.injectedAt = null;
  testState.restartCount += 1;
  testState.lastRestartAt = new Date().toISOString();
  testState.processUptimeSec = 1;
  testState.simulatedCpuUsage = 16;
  testState.simulatedMemoryUsage = 38;

  if (clearIncidents) {
    storage.clearActiveIncidentsForService('srv-chimera-controlled', action);
  }

  storage.addAuditLog({
    timestamp: new Date().toISOString(),
    eventType: 'RECOVERY_COMPLETED',
    relatedIncidentId: null,
    serviceId: 'srv-chimera-controlled',
    actionDetails: `Controlled test service restarted (${action}). Fault cleared.`,
    result: 'SUCCESS',
  });

  return {
    success: true,
    message: `Test service restarted successfully. Restart count: ${testState.restartCount}`,
  };
}

router.get('/health', async (req: Request, res: Response) => {
  const target = req.query.target as string | undefined;

  if (target === 'payment') {
    return res.status(200).json({
      status: 'UP',
      service: 'Payment Gateway Proxy',
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      dependencies: { pciProxy: 'CONNECTED', vault: 'HEALTHY' },
    });
  }

  if (target === 'inventory') {
    return res.status(200).json({
      status: 'UP',
      service: 'Inventory Sync Worker',
      version: '2.0.4',
      timestamp: new Date().toISOString(),
      queueLagMs: 12,
    });
  }

  switch (testState.faultMode) {
    case 'PROCESS_CRASH':
    case 'UNAVAILABLE':
      return res.status(503).json({
        status: 'DOWN',
        service: 'Order Processing Test Service',
        error: 'CRITICAL_PROCESS_CRASH',
        message: testState.faultMessage,
        timestamp: new Date().toISOString(),
      });

    case 'HIGH_LATENCY':
      await new Promise((resolve) => setTimeout(resolve, 3200));
      return res.status(200).json({
        status: 'DEGRADED',
        service: 'Order Processing Test Service',
        warning: 'THREAD_POOL_SATURATION',
        delayMs: 3200,
        timestamp: new Date().toISOString(),
      });

    case 'ERROR_SPIKE':
      return res.status(500).json({
        status: 'ERROR',
        service: 'Order Processing Test Service',
        error: 'HTTP_500_INTERNAL_SERVER_ERROR',
        message: 'Order dispatch queue threw unhandled RuntimeException in order_worker.ts:142',
        timestamp: new Date().toISOString(),
      });

    case 'DB_CONNECTION_FAIL':
      return res.status(500).json({
        status: 'ERROR',
        service: 'Order Processing Test Service',
        error: 'DATABASE_POOL_EXHAUSTED',
        message: 'Connection pool timeout after 5000ms: max 20 connections occupied by abandoned queries',
        timestamp: new Date().toISOString(),
      });

    case 'HIGH_CPU':
      return res.status(200).json({
        status: 'DEGRADED',
        service: 'Order Processing Test Service',
        warning: 'HIGH_CPU_CONSUMPTION',
        cpuUsagePct: testState.simulatedCpuUsage,
        memoryUsagePct: testState.simulatedMemoryUsage,
        timestamp: new Date().toISOString(),
      });

    case 'MEMORY_LEAK':
      return res.status(200).json({
        status: 'DEGRADED',
        service: 'Order Processing Test Service',
        warning: 'HEAP_MEMORY_PRESSURE',
        cpuUsagePct: testState.simulatedCpuUsage,
        memoryUsagePct: testState.simulatedMemoryUsage,
        timestamp: new Date().toISOString(),
      });

    case 'NONE':
    default:
      return res.status(200).json({
        status: 'UP',
        service: 'Order Processing Test Service',
        version: '1.4.2',
        uptimeSec: testState.processUptimeSec,
        cpuUsagePct: testState.simulatedCpuUsage,
        memoryUsagePct: testState.simulatedMemoryUsage,
        activeWorkers: 4,
        timestamp: new Date().toISOString(),
      });
  }
});

router.get('/metrics', (req: Request, res: Response) => {
  res.json({
    ...testState,
    nodeEnv: 'development',
    pid: process.pid,
    heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    timestamp: new Date().toISOString(),
  });
});

router.post('/inject-fault', (req: Request, res: Response) => {
  const { mode } = req.body as { mode: FaultMode };

  const validModes: FaultMode[] = [
    'NONE',
    'UNAVAILABLE',
    'PROCESS_CRASH',
    'HIGH_LATENCY',
    'ERROR_SPIKE',
    'HIGH_CPU',
    'MEMORY_LEAK',
    'DB_CONNECTION_FAIL',
  ];

  if (!validModes.includes(mode)) {
    return res.status(400).json({ error: `Invalid fault mode: ${mode}` });
  }

  // Clear any existing active incidents on srv-chimera-controlled so the new fault runs fresh
  if (mode !== 'NONE') {
    storage.clearActiveIncidentsForService('srv-chimera-controlled', 'SUPERSEDED_NEW_FAULT');
  } else {
    storage.clearActiveIncidentsForService('srv-chimera-controlled', 'CLEARED_NONE');
  }

  testState.faultMode = mode;
  testState.injectedAt = mode === 'NONE' ? null : new Date().toISOString();

  const messages: Record<FaultMode, string> = {
    NONE: 'System operating nominally',
    UNAVAILABLE: 'Simulated network gateway failure / 503 Service Unavailable',
    PROCESS_CRASH: 'Simulated fatal SIGSEGV segmentation fault & process termination',
    HIGH_LATENCY: 'Simulated request pipeline throttling with 3200ms sleep delay',
    ERROR_SPIKE: 'Simulated cascading HTTP 500 unhandled exceptions in request handler',
    HIGH_CPU: 'Simulated spin-lock runaway computation saturating 94% CPU core',
    MEMORY_LEAK: 'Simulated buffer leak consuming V8 heap memory > 90%',
    DB_CONNECTION_FAIL: 'Simulated PostgreSQL connection pool exhaustion (0 active slots)',
  };

  testState.faultMessage = messages[mode];
  if (mode === 'HIGH_CPU') testState.simulatedCpuUsage = 94;
  if (mode === 'MEMORY_LEAK') testState.simulatedMemoryUsage = 91;

  storage.addAuditLog({
    timestamp: new Date().toISOString(),
    eventType: 'FAULT_INJECTED',
    relatedIncidentId: null,
    serviceId: 'srv-chimera-controlled',
    actionDetails: `Controlled fault injected: ${mode} - ${messages[mode]}`,
    result: mode === 'NONE' ? 'INFO' : 'WARNING',
  });

  if (onFaultInjectedHandler) {
    try {
      onFaultInjectedHandler(mode);
    } catch (e) {
      console.warn('[Chimera TestBed] Error in fault callback:', e);
    }
  }

  res.json({
    success: true,
    message: `Fault state set to ${mode}`,
    state: testState,
  });
});

router.post('/restart', (req: Request, res: Response) => {
  const { action } = req.body || {};
  const result = restartTestService(action || 'RESTART_SERVICE');
  res.json(result);
});

router.post('/reset', (req: Request, res: Response) => {
  const result = restartTestService('MANUAL_RESET', true);
  res.json(result);
});

export default router;
