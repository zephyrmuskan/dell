# TrustLens AI — Fleet Compliance & Security Gateway

TrustLens AI is an enterprise decision copilot designed for security teams and system administrators. It integrates with **Microsoft Intune** and **VMware Workspace ONE UEM** to provide real-time compliance monitoring, telemetry analysis, and autonomous policy remediation.

---

## 🛡️ Key Features

- **MDM Compliance Dashboard**: Real-time monitoring of fleet status, active security recommendations, and compliance gate status.
- **AI Trust Companion**: An interactive decision assistant powered by LLMs (Gemini/Groq/Local Rules) that explains AI recommendations to operators.
- **SHAP Feature Attributions Matrix**: Translates machine learning security scores into plain-language telemetry explanations.
- **Multi-Agent Consensus Validation**: Resolves disputes between agent classes (e.g. Detection, Risk Assessment, Devil's Advocate) before dispatching commands.
- **Dynamic Autonomy Levels**: Configurable rules for dispatching endpoint compliance commands.

---

## ⚙️ Standardized AI Autonomy Levels

The application supports three standardized autonomy levels for fleet control:

1. **Level 1 (Always Ask Me)**:
   - *Behavior*: Strict operator-approved execution. All compliance recommendations (both low-risk patches and critical quarantines) pause and wait for manual operator review.
   
2. **Level 2 (Auto Low Risk)**:
   - *Behavior*: Pre-approved execution of safe tasks. Low-risk operations (such as deploying OS patches, application updates, or configuration installers) are dispatched automatically. High-risk actions (such as isolating host endpoints) require manual operator sign-off.
   
3. **Level 3 (Act and Notify)**:
   - *Behavior*: Full execution autonomy. All remediation actions are dispatched immediately. The system executes the API commands to the UEM gateways first, then writes audit logs and notifies the administrator post-execution.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (TypeScript, Vite)
- **Styling**: Vanilla CSS, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM / Database**: SQLAlchemy, SQLite (`trustlens.db`)
- **Failover Sequence**: Direct Google Gemini API requests with automated failover to Groq (Llama-3.3) and a high-quality local rule-based mock engine.

---

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.8+)
- [SQLite](https://www.sqlite.org/)

### Installation & Run Instructions

#### 1. Running the Backend Server
1. Ensure your `.env` file contains valid API keys for:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   HF_API_KEY=your_huggingface_api_key
   ```
2. Run the main server script:
   ```bash
   python app.py
   ```
   *The FastAPI server will start on [http://127.0.0.1:8000](http://127.0.0.1:8000).*

#### 2. Running the Frontend Server
1. Install project dependencies:
   ```bash
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *The client interface will start on [http://localhost:5173/](http://localhost:5173/).*
