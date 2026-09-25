# SwachhLens — National Finale Live Demonstration Runbook

**Audience:** Technical Presenter / Demo Operator  
**Event:** TSM TECHNOVA 2026 Grand Finale  
**Core Rule:** *Never debug network configs, API keys, or code in front of the jury.*

---

## 1. Pre-Flight Startup Order

Execute in 3 separate terminal tabs prior to presentation:

```bash
# Tab 1: Local Ollama Fallback Service (Ensure warm before demo)
ollama serve
# Verify model is ready: ollama run qwen3-vl:2b "ready"

# Tab 2: Citizen App (Runs on http://localhost:5173)
cd C:\swachhlens\citizen-app
npm run dev

# Tab 3: Municipal Operations Portal (Runs on http://localhost:5174)
cd C:\swachhlens\portal
npm run dev
```

---

## 2. Pre-Demo Verification Checklist

1. **Groq API Key:** Confirm `VITE_GROQ_API_KEY` exists in `citizen-app/.env` (Primary Vision model: `qwen/qwen3.8-27b`).
2. **Local Fallback:** Verify `http://127.0.0.1:11434` responds and `qwen3-vl:2b` is listed.
3. **Firebase Connection:** Open Citizen app and Municipal Portal in browser; confirm anonymous citizen auth and municipal dashboard load cleanly.

---

## 3. Standard End-to-End Demonstration Flow

1. **Citizen Portal (`http://localhost:5173`):**
   - Click **Report Waste** (camera tab).
   - Select or capture waste evidence using pre-tested asset: `C:\swachhlens\demo-assets\garbag20.jpeg`.
   - Add optional citizen note: *"Roadside accumulation blocking pedestrian footpath."*
   - Click **Analyze with AI** (Primary Groq response takes ~1.5–2.5s).
   - Show Jury:
     - **AI Waste Assessment:** `Garbage Dump`, Volume `Very Large`, Confidence `High` (with tooltip).
     - **Bio-Waste Safety Gate:** Notice bio-hazard is NOT triggered on general street waste (`false`).
     - **Deterministic Priority & Urgency Score:** Explain formula `(vol*40) + (loc*30) + (freq*20) + (age*10)`.
     - **AI Advisory Recommendation:** Mini Truck + 5 workers.
   - Click **Confirm & Submit Report**. Copy Complaint ID.

2. **Municipal Command Portal (`http://localhost:5174`):**
   - Locate newly submitted complaint at top of queue.
   - Click into Complaint Detail.
   - Show Decision Engine: Review AI evidence and click **Dispatch** → **Accept Recommendation** (or **Override Manually** to demonstrate human authority).
   - Confirm assignment to team (e.g. `team-mini-truck-01`).

3. **Field Supervisor Console (`/my-team` or supervisor role):**
   - Show assigned job in supervisor queue.
   - Click **Mark Arrived** → **Start Work** (`in_progress`).
   - Click **Submit Completion Evidence** → upload after-cleanup image.

4. **Municipal Verification & Resolution:**
   - Operator reviews field evidence and clicks **Verify & Mark Resolved**.
   - Show that team workload counter decrements upon verification.
   - Return to Citizen App: show citizen live timeline transitioned to **Resolved**.

---

## 4. Resilience & Fallback Handling

| Scenario | System Behavior | Presenter Action / Talking Point |
|---|---|---|
| **Normal Operation** | Groq analyzes image in ~2s (`Analysis provider: Groq Vision`). | Highlight real-time latency and edge-cloud hybrid architecture. |
| **Groq 429 / Cloud Network Drop** | Router detects network/rate limit error → switches to Local Ollama (`qwen3-vl:2b`) with live UI message: *"Cloud AI unavailable — attempting local AI..."* | Explain our multi-tier resilience: edge AI safeguards operations when internet fails. |
| **All AI Providers Unavailable** | Graceful error card: *"AI analysis is temporarily unavailable. Please retry."* No crash or blank screen. | Highlight ErrorBoundary and human fallback: citizens can still submit reports manually for inspection. |

---

## 5. Verified Local Backup Assets

Use only authentic local assets from:
`C:\swachhlens\demo-assets\`

- `garbag20.jpeg` (43 KB) — Standard massive roadside dump (Demo Choice #1)
- `garbage10.jpeg` (65 KB) — Commercial street waste near flyover (Demo Choice #2)
- `garbage15.jpeg` (48 KB) — Street plastic accumulation (Demo Choice #3)
- `garbage3.jpeg` (39 KB) — Market vegetable/organic waste

---

## 6. Jury Defense & Responsible AI Cheat-Sheet

- **Confidence vs. Accuracy:** Confidence is the model's self-assessed probability token, displayed as *High/Moderate/Low*. Real accuracy was measured independently on our 10-image test harness (90% exact match, 0% bio-hazard false alarms).
- **Human-in-the-Loop:** AI is strictly decision support. Municipal operators retain 100% control via Accept/Override and must verify field evidence before complaints resolve.
