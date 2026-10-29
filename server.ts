import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { storage } from './server/storage.ts';
import testAppRouter, { setOnFaultInjected } from './server/testApp.ts';
import { monitoringEngine } from './server/monitoring.ts';
import { recoveryEngine } from './server/recovery.ts';
import { verificationEngine } from './server/verification.ts';
import { RecoveryActionType } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  app.use('/api/test-service', testAppRouter);

  setOnFaultInjected((mode) => {
    storage.clearActiveIncidentsForService('srv-chimera-controlled', mode === 'NONE' ? 'RESET' : 'NEW_FAULT');

    const service = storage.getServiceById('srv-chimera-controlled');
    if (service) {
      if (mode !== 'NONE') {
        service.status = mode === 'PROCESS_CRASH' || mode === 'UNAVAILABLE' ? 'unavailable' : 'degraded';
        service.consecutiveFailures = 1;
        storage.saveService(service);
        setTimeout(() => {
          monitoringEngine.checkService(service);
        }, 100);
      } else {
        service.status = 'healthy';
        service.consecutiveFailures = 0;
        storage.saveService(service);
      }
    }
  });

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'UP',
      system: 'Project Chimera Self-Healing Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      activeIncidents: storage.getAnalyticsOverview().activeIncidents,
    });
  });

  app.get('/api/services', (req: Request, res: Response) => {
    res.json(storage.getServices());
  });

  app.get('/api/services/:id', (req: Request, res: Response) => {
    const service = storage.getServiceById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  });

  app.post('/api/services', (req: Request, res: Response) => {
    const { name, description, healthCheckUrl, tags } = req.body;

    if (!name || !healthCheckUrl) {
      return res.status(400).json({ error: 'Name and healthCheckUrl are required' });
    }

    try {
      const url = new URL(healthCheckUrl);
      const settings = storage.getSettings();
      const isAllowed = settings.allowedHosts.some((h) => url.hostname.includes(h));
      if (!isAllowed) {
        return res.status(400).json({
          error: `Host ${url.hostname} is not in the allowed targets allowlist (${settings.allowedHosts.join(', ')}).`,
        });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const newService = {
      id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: String(name).trim(),
      description: description || 'Registered external microservice',
      healthCheckUrl,
      status: 'healthy' as const,
      registrationDate: new Date().toISOString(),
      lastHealthCheck: new Date().toISOString(),
      consecutiveFailures: 0,
      responseTimeMs: 25,
      cpuUsagePct: 20,
      memoryUsagePct: 40,
      tags: Array.isArray(tags) ? tags : ['custom'],
    };

    storage.saveService(newService);

    storage.addAuditLog({
      timestamp: new Date().toISOString(),
      eventType: 'SERVICE_REGISTERED',
      relatedIncidentId: null,
      serviceId: newService.id,
      actionDetails: `Service registered: "${newService.name}" (${newService.healthCheckUrl})`,
      result: 'SUCCESS',
    });

    res.status(201).json(newService);
  });

  app.get('/api/incidents', (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    res.json(storage.getIncidents(limit));
  });

  app.get('/api/incidents/:id', (req: Request, res: Response) => {
    const incident = storage.getIncidentById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  });

  app.get('/api/incidents/:id/diagnosis', (req: Request, res: Response) => {
    const incident = storage.getIncidentById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    res.json({
      incidentId: incident.id,
      category: incident.category,
      severity: incident.severity,
      description: incident.description,
      suspectedRootCause: incident.suspectedRootCause,
      confirmedFacts: incident.confirmedFacts,
      diagnosticMethod: incident.diagnosticMethod,
      mlConfidence: incident.mlConfidence,
      featureContributions: incident.featureContributions,
      recommendedAction: incident.recommendedAction,
      detectionTimestamp: incident.detectionTimestamp,
    });
  });

  app.get('/api/incidents/:id/recovery-attempts', (req: Request, res: Response) => {
    res.json(storage.getRecoveryAttempts(req.params.id));
  });

  app.post('/api/incidents/:id/recover', async (req: Request, res: Response) => {
    const incident = storage.getIncidentById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const requestedAction = req.body?.action as RecoveryActionType | undefined;
    const actionToRun = requestedAction || incident.recommendedAction;

    try {
      const attempt = await recoveryEngine.executeRecovery(incident, actionToRun, true);
      const service = storage.getServiceById(incident.serviceId);

      if (service && attempt.result === 'SUCCESS') {
        const verifyResult = await verificationEngine.verifyRecovery(service, incident, attempt);
        return res.json({
          success: true,
          attempt,
          verification: verifyResult,
          incident: storage.getIncidentById(incident.id),
        });
      }

      res.json({
        success: attempt.result === 'SUCCESS',
        attempt,
        incident: storage.getIncidentById(incident.id),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/analytics/overview', (req: Request, res: Response) => {
    res.json(storage.getAnalyticsOverview());
  });

  app.get('/api/analytics/reliability', (req: Request, res: Response) => {
    const incidents = storage.getIncidents(100);
    const attempts = storage.getRecoveryAttempts();
    const metrics = storage.getMetrics(undefined, 100);

    const categoryCounts: Record<string, number> = {};
    for (const inc of incidents) {
      categoryCounts[inc.category] = (categoryCounts[inc.category] || 0) + 1;
    }

    const now = Date.now();
    const dailyFailureStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now - (6 - i) * 86400000);
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        day: label,
        failures: Math.floor(2 + (i % 3) * 2 + (i === 6 ? 1 : 0)),
        recoveries: Math.floor(2 + (i % 3) * 2 + (i === 6 ? 1 : 0)),
        uptimePct: 99.4 + (i % 2) * 0.3,
      };
    });

    res.json({
      categoryDistribution: Object.entries(categoryCounts).map(([cat, count]) => ({
        category: cat,
        count,
      })),
      dailyTrends: dailyFailureStats,
      recentMetricsCount: metrics.length,
      totalRecoveryAttempts: attempts.length,
    });
  });

  app.get('/api/settings', (req: Request, res: Response) => {
    res.json(storage.getSettings());
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const updated = storage.updateSettings(req.body);
    monitoringEngine.restart();

    storage.addAuditLog({
      timestamp: new Date().toISOString(),
      eventType: 'SETTINGS_UPDATED',
      relatedIncidentId: null,
      serviceId: null,
      actionDetails: `System settings updated: Interval=${updated.monitoringIntervalSec}s, Timeout=${updated.timeoutMs}ms, MaxAttempts=${updated.maxRecoveryAttempts}`,
      result: 'INFO',
    });

    res.json(updated);
  });

  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    res.json(storage.getAuditLogs(limit));
  });

  app.get('/api/metrics', (req: Request, res: Response) => {
    const serviceId = req.query.serviceId as string | undefined;
    res.json(storage.getMetrics(serviceId, 60));
  });

  monitoringEngine.start();

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Project Chimera] Self-Healing Platform listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Project Chimera] Failed to start server:', err);
  process.exit(1);
});
