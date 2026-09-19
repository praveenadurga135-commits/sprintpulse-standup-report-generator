# SprintPulse — Engineering Intelligence Platform

A complete, polished, interactive web application built strictly to the hackathon problem brief: **AI Standup & Sprint Report Generator** (branded professionally as **SprintPulse** to adhere strictly to the rule prohibiting technical/developer tooling names in the visible UI).

## 🚀 Live Demo & Quickstart
```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Or run production preview (default: http://localhost:5173/)
npm run preview -- --port 5173
```

## 📋 Features Checklist (100% Implemented)
- [x] Multi-Role Authentication (Manager vs. Team Member) with show/hide password and forgot password modal
- [x] Fast 1-Click Demo Persona Switcher (David Miller, Sarah Chen, Tejasri Nair, Rahul Sharma, Ananya Rao, Karthik Verma, Vikram Sen)
- [x] Project Creation with unique invite code generation (e.g. `ECP-7K42`, `MCA-3391`) and 1-click clipboard copy
- [x] Sprint Management (Create Sprint, Goal, Start/End Dates, Working Days)
- [x] Project Join Requests via invite code and Manager Approval/Rejection workflow
- [x] Daily Standup Submission (Yesterday, Today, Blockers)
- [x] Voice-to-Text Input with recording animation, elapsed timer, dictation parsing, and presets
- [x] Standup draft saving and celebratory submission animation
- [x] Activity Stream / Standup Timeline grouped by date, engineer, and sprint with multi-filter search
- [x] Semantic Recurring Blocker Detection with occurrences count, affected members, timeline, and interactive resolution
- [x] Interactive Blocker Burndown Chart with active, resolved, and cumulative trajectories
- [x] Sprint Summary Generator with multi-step synthesis animation and structured executive cards
- [x] Stakeholder Progress Report Generator with print-friendly layout, PDF export, and Markdown copying
- [x] Light and Dark Mode with local persistence
- [x] Full responsive design across desktop, tablet, and mobile with drawer navigation
- [x] Preloaded realistic 10-day sprint history across 5 engineer personas
- [x] Strict Branding Rule Compliance: zero technical/developer tooling terms displayed in UI
