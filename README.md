# Project Chimera: AI-Powered Self-Healing Software System

An autonomous software reliability platform that monitors microservices, detects degradation, diagnoses root causes using a hybrid rule-based and Scikit-learn ML engine, safely executes allowlisted remediation policies, and verifies genuine health restoration.

---

## 1. System Architecture

```
[ Controlled Microservice Fleet ] (e.g. Order Processing Test Service)
         |
         | HTTP Health Probing (Every 4s)
         v
[ Module 1: Monitoring Engine ]
   * SLA Latency Check (> 3000ms)
   * Availability & HTTP Error Tracking
   * Resource Usage Telemetry (CPU / RAM)
   * Duplicate Incident Suppression Filter
         |
         | Failure Detected (503 / Timeout / 500 / Saturation)
         v
[ Module 2: AI Root-Cause Diagnostic Engine ]
   * Transparent Rule Baseline (Empirical Evidence)
   * Scikit-Learn Random Forest Classifier
   * Multi-Class Probability & Feature Importance
   * Confidence Cutoff (>= 0.60 threshold)
         |
         | Recommended Action (Mapped to Allowlist)
         v
[ Module 3: Intelligent Recovery Engine ]
   * Strict Security Allowlist Containment
   * Anti-Thrashing Cooldown Enforcer (25s)
   * Maximum Attempt Bounds (Max 3 Attempts)
   * Escalation Gate (Human Intervention when exceeded)
         |
         | Safe Execution (Restart / Pool Reset / Scale / Breaker)
         v
[ Module 4: Recovery Verification Engine ]
   * Readiness Probe Sequence (3 consecutive checks)
   * Latency Recovery Validation
   * Status Transition: DETECTED -> RECOVERING -> VERIFYING -> RECOVERED
   * MTTR & SLA Metric Compilation
         |
         v
[ Module 5: Reliability Command Console ]
   * Real-Time Service Health & High-Density Telemetry
   * Incident Triage Desk & Root-Cause Studio
   * Recovery Policy Audit & Failure Analytics
   * Interactive Controlled Fault Simulator
```

---

## 2. Project Folder Structure

```
project-chimera/
├── .env.example                    # Environment variable template
├── README.md                       # Comprehensive capstone documentation
├── docker-compose.yml              # Containerized multi-service deployment
├── package.json                    # Fullstack scripts and UI dependencies
├── requirements.txt                # Python backend & ML dependencies
├── run_windows.bat                 # 1-click Windows initialization batch script
├── server.ts                       # Express full-stack API server + Vite middlewares
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
│
├── server/                         # Backend Engine Modules
│   ├── diagnosis.ts                # Module 2: Rule-based + ML Root-Cause Engine
│   ├── monitoring.ts               # Module 1: Background health monitor & event emitter
│   ├── recovery.ts                 # Module 3: Allowlist enforcement & policy dispatcher
│   ├── storage.ts                  # Persistent ACID-compliant database store
│   ├── testApp.ts                  # Monitored controlled testbed with fault injection
│   └── verification.ts             # Module 4: Multi-probe verification & SLA auditor
│
├── src/                            # Frontend Reliability Dashboard
│   ├── App.tsx                     # Main application layout & tab controller
│   ├── main.tsx                    # React DOM entry point
│   ├── index.css                   # Tailwind CSS styling
│   ├── types/
│   │   └── index.ts                # TypeScript domain models & interfaces
│   └── components/
│       ├── AnalyticsView.tsx       # Module 5: SVG analytics, trends & MTTR tracker
│       ├── DiagnosisView.tsx       # Module 5: Root-cause studio & ML feature weights
│       ├── FaultSimulatorBanner.tsx# Interactive failure injection testbed
│       ├── IncidentDetailModal.tsx # Incident investigation drawer
│       ├── IncidentsView.tsx       # Module 5: Incident triage desk
│       ├── OverviewView.tsx        # Module 5: Fleet summary & KPI cards
│       ├── RecoveryView.tsx        # Module 5: Policy allowlist & recovery audit
│       ├── RegisterServiceModal.tsx# SSRF-protected service target registration
│       ├── ServicesView.tsx        # Module 5: High-density service telemetry grid
│       ├── SettingsView.tsx        # Module 5: Engine parameters & policy limits
│       ├── Sidebar.tsx             # Enterprise sidebar navigation
│       └── TopBar.tsx              # Top bar breadcrumbs & live status
│
├── backend/app/                    # Standalone FastAPI Python Backend (Alternative)
│   ├── main.py                     # FastAPI REST API endpoints
│   ├── models.py                   # SQLAlchemy ORM models
│   └── schemas.py                  # Pydantic validation schemas
│
├── ml/                             # Scikit-Learn Machine Learning Pipeline
│   ├── dataset_generator.py        # Realistic failure telemetry dataset generator
│   └── train_model.py              # Random Forest classifier training script
│
└── tests/                          # Automated Reliability Verification Suite
    └── run_tests.py                # 12-test comprehensive reliability verification
```

---

## 3. Quickstart & Windows Execution Guide

### Prerequisites
* **Node.js** v18+ installed ([https://nodejs.org/](https://nodejs.org/))
* **Python** 3.10+ installed ([https://www.python.org/](https://www.python.org/))

### Method 1: Automated Windows Batch Script
Double-click `run_windows.bat` or run:
```cmd
run_windows.bat
```

### Method 2: Manual Terminal Execution
1. Install UI and Full-Stack Dependencies:
   ```bash
   npm install
   ```

2. Run the 12 Automated Verification Tests:
   ```bash
   python tests/run_tests.py
   ```
   *Expected output: `Ran 12 tests in 0.002s - OK`*

3. Launch the Chimera Self-Healing Platform:
   ```bash
   npm run dev
   ```

4. Navigate to `http://localhost:3000` in your web browser.

---

## 4. Reproducible Capstone Demonstration Workflow

To demonstrate the full self-healing lifecycle during evaluation:

1. **Step 1: Baseline Health Verification**
   * Open the dashboard at `http://localhost:3000`.
   * Check **System Overview** and **Service Health**: Notice `Order Processing Test Service` is `HEALTHY` (status UP, latency ~30ms).

2. **Step 2: Inject a Controlled Failure**
   * Click **Inject Fault** in the top bar (or open the **Fault Simulator** tab).
   * Click **Process Crash (503)** or **DB Pool Exhaustion**.
   * Observe the active fault notification appear immediately.

3. **Step 3: Autonomous Monitoring & Detection (Module 1)**
   * Within 4 seconds, the monitoring engine detects the failed probe.
   * Service transitions to `UNAVAILABLE` or `DEGRADED`.
   * A unique incident ID (e.g. `INC-20261014-XXXX`) is automatically generated.
   * Notice that duplicate incidents are suppressed while the incident is open.

4. **Step 4: AI Root-Cause Diagnostic Analysis (Module 2)**
   * Open the **Root-Cause Analysis** tab.
   * Review the **Confirmed Empirical Evidence** (observed HTTP status, latency, error signature).
   * Review the **Suspected Root Cause** and **Classifier Confidence** (e.g., 97% for Service Crash).
   * Inspect the **Feature Impact Breakdown** bar chart.

5. **Step 5: Autonomous Policy Recovery (Module 3)**
   * Chimera matches the incident against the approved allowlist (`RESTART_SERVICE` or `CLEAR_CACHE_RESET_POOL`).
   * The recovery engine dispatches the policy and logs Attempt #1.
   * Cooldown safety rules and attempt limits are visibly enforced.

6. **Step 6: Multi-Probe Recovery Verification (Module 4)**
   * The verification engine runs 3 consecutive readiness probes.
   * Once all 3 pass, the incident status transitions to `RECOVERED`.
   * Service health returns to `HEALTHY`.
   * MTTR, success rate, and duration metrics update live on the **Reliability Analytics** tab.

7. **Step 7: Manual Override & Safety Containment Test**
   * Open **Recovery Policies** -> Trigger manual remediation or set Auto-Recovery to OFF in **Engine Settings** to require human approval.
