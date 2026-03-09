---
stepsCompleted: [1]
inputDocuments: []
session_topic: 'Unified pricing strategy (₹100/hr) across MiniParty full-stack platform'
session_goals: 'Secure end-to-end pricing: frontend display, dynamic calculation, tamper-proof backend, SQLite persistence, confirmation UX'
selected_approach: ''
techniques_used: []
ideas_generated: []
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Akhildas
**Date:** 2026-03-09

## Session Overview

**Topic:** Unified pricing strategy (₹100/hr) across MiniParty full-stack platform (React/Go/SQLite)
**Goals:**
- Secure architecture — server-side price calculation to prevent tampering
- Professional ₹100/hr display on Home.jsx
- Dynamic total price calculation in BookingForm.jsx (1–8 hours)
- Go backend model + handler updates with correct currency data types
- SQLite schema update to persist total_price
- Confirmation page showing duration + total recap

### Context Guidance

_MiniParty is a React/Go/SQLite party booking platform. The pricing model is flat-rate ₹100/hr. Security is a priority — the backend must be the source of truth for price calculation, not the frontend._

### Session Setup

_Akhildas wants to brainstorm the best architectural approach for implementing a unified pricing model. Key tensions: UX responsiveness (live frontend calculation) vs security (server-side price authority). Additional considerations: integer vs float for currency, scalable MVP patterns, and clean confirmation flow._
