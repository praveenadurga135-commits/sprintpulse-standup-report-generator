# SprintPulse — Standup & Sprint Report Generator

SprintPulse is a team collaboration and sprint reporting platform designed to simplify daily standups, track team progress, identify recurring blockers, and generate stakeholder-ready sprint reports.

It supports separate **Manager** and **Team Member** roles with project-based access, invite-code joining, sprint management, daily standups, voice-to-text input, blocker tracking, sprint summaries, and stakeholder reporting.

---

## ✨ Features

### 🔐 Role-Based Authentication

* Manager and Team Member registration/login
* Role-based dashboards and navigation
* Forgot-password flow
* Profile management and avatar support
* Manager and Team Member account separation

### 📁 Project Management

* Create new projects
* Generate unique project invite codes
* Team members join using invite codes
* Manager approval/rejection workflow
* Project-specific team access
* Empty project states for users without projects

### 🏃 Sprint Management

* Create and manage sprints
* Define sprint goals
* Set start and end dates
* Track sprint status and working days

### 📝 Daily Standups

Team members can submit:

* Yesterday's work
* Today's plan
* Current blockers

Additional functionality:

* Voice-to-text input
* Draft saving
* Editable transcriptions
* Submission status
* Standup history

### 👥 Team Updates

Managers and approved team members can view relevant team updates with:

* Team member
* Date
* Sprint
* Yesterday's work
* Today's plan
* Blockers

### 🚧 Recurring Blocker Detection

The application identifies recurring blockers across daily standups.

It can group differently worded descriptions that represent the same underlying issue and track:

* Occurrence count
* Affected team members
* First detected date
* Last detected date
* Severity
* Resolution status

### 📉 Blocker Burndown

Interactive blocker tracking with:

* Active blockers
* Resolved blockers
* New blockers
* Cumulative blocker trends

### 📊 Sprint Summary

Generate structured sprint summaries based on actual submitted team updates, including:

* Overall progress
* Completed work
* Work in progress
* Key blockers
* Risks
* Next steps

### 📄 Stakeholder Reports

Generate professional stakeholder-ready reports containing:

* Executive summary
* Key achievements
* Current progress
* Risks
* Blockers
* Next steps
* Sprint status

Reports can be prepared for sharing and export through the existing interface.

### 🎙️ Voice-to-Text

Daily standup fields support speech input through browser speech recognition, allowing users to speak their updates and edit the resulting transcript before submission.

### 🌙 Responsive UI

* Light mode
* Dark mode
* Responsive desktop/tablet/mobile layouts
* Interactive navigation
* Smooth transitions and UI states

---

## 🧠 LLM Integration

SprintPulse uses a server-side Groq integration for natural-language generation.

### Model

```text
openai/gpt-oss-120b
```

The model is used for:

* Sprint Summary generation
* Stakeholder Report generation
* Regenerate functionality

Generated content is based on the project's actual sprint, standup, blocker, and team data.

The generation prompts are designed to reduce unsupported claims and avoid inventing project information.

---

## 🏗️ Architecture

```text
                    SprintPulse
                         │
        ┌────────────────┴────────────────┐
        │                                 │
    Team Manager                     Team Member
        │                                 │
        ▼                                 ▼
   Create Project                    Join Project
        │                                 │
        ▼                                 ▼
   Invite Code                     Join Request
        │                                 │
        └──────────────┬──────────────────┘
                       ▼
                Project Membership
                       │
                       ▼
                    Sprint
                       │
                       ▼
               Daily Standups
                       │
                       ▼
              Project Data Layer
                       │
              ┌────────┴────────┐
              ▼                 ▼
        Local Analysis      Groq Service
              │                 │
              └────────┬────────┘
                       ▼
              Sprint Summary
                       │
                       ▼
             Stakeholder Report
```

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Recharts
* Lucide React

### Backend / Server

* Node.js
* HTTP server
* Server-side Groq proxy

### Data

* Browser `localStorage`
* `sessionStorage` for session handling where applicable

### Language Generation

* Groq API
* `openai/gpt-oss-120b`

### Browser APIs

* Web Speech Recognition API
* Clipboard API

---

## 📂 Project Structure

```text
sprintai/
│
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── blockers/
│   │   ├── burndown/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   ├── modals/
│   │   ├── profile/
│   │   ├── projects/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── standup/
│   │   ├── team/
│   │   └── timeline/
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ProjectContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   │
│   ├── services/
│   │   ├── analyzer.ts
│   │   ├── seedData.ts
│   │   ├── speechService.ts
│   │   └── storage.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── App.tsx
│   ├── App.css
│   └── index.css
│
├── server/
│   └── groqProxy.ts
│
├── server.js
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── .env.example
└── .gitignore
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/sprintpulse-standup-report-generator.git
cd sprintpulse-standup-report-generator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

Never commit the `.env` file to GitHub.

The repository includes `.env.example` for configuration reference.

### 4. Start the development server

```bash
npm run dev
```

The Vite development server also provides the application API routes used for generation.

### 5. Build the project

```bash
npm run build
```

### 6. Run the production server

```bash
npm start
```

The production server serves the built application and the server-side generation endpoints.

---

## 🔌 API Endpoints

### Generate Sprint Summary

```text
POST /api/generate-summary
```

Generates a structured sprint summary from the supplied project, sprint, updates, and blockers.

### Generate Stakeholder Report

```text
POST /api/generate-report
```

Generates a stakeholder-ready progress report from the current project data.

### LLM Configuration Status

```text
GET /api/llm-status
```

Returns whether the server-side generation service is configured and which model is selected.

---

## 🔄 Typical Workflow

### Manager

```text
Register / Login
      ↓
Create Project
      ↓
Generate Invite Code
      ↓
Create Sprint
      ↓
Approve Team Members
      ↓
Monitor Team Updates
      ↓
Track Recurring Blockers
      ↓
Generate Sprint Summary
      ↓
Generate Stakeholder Report
```

### Team Member

```text
Register / Login
      ↓
Enter Project Invite Code
      ↓
Join Request / Approval
      ↓
Select Sprint
      ↓
Submit Daily Standup
      ↓
View Team Updates
```

---

## 🔒 Security Notes

* Keep `GROQ_API_KEY` in `.env`.
* Do not expose the key through frontend code.
* Do not use `VITE_GROQ_API_KEY` for the server secret.
* Do not commit `.env` to GitHub.

### Prototype Data Storage

The current prototype uses browser storage for application data and authentication state rather than a hosted database.

Because of this, the project is best suited for:

* Hackathon demonstrations
* Local development
* Prototype evaluation

A production deployment should replace browser-local persistence with a secure backend/database and production-grade authentication.

---

## 🎯 Hackathon Focus

SprintPulse addresses the problem of manually compiling standup updates into sprint-level communication.

The platform brings together:

**Daily Updates → Team Visibility → Blocker Detection → Sprint Insights → Stakeholder Reporting**

This helps turn scattered daily standup information into structured sprint-level information through a single workflow.

---

## 📌 Future Enhancements

Potential future additions include:

* Hosted database persistence
* Production authentication
* Slack/Discord integration
* Email delivery of reports
* PDF report generation improvements
* Notion integration
* Advanced team analytics
* Deployment-specific environment configuration

---

## 👩‍💻 Author

**Lakkimsetti Tejasri**

B.Tech Student
GitHub: https://github.com/lakkimsettitejasri-dotcom

---

## 📄 License

This project is developed as a hackathon/prototype project.

Add an appropriate open-source license before distributing the repository publicly.
