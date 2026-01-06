# Core Compliance Hub

## Overview
Occupational health and compliance platform featuring an AI-powered OccHealth Consultant and OSHA 300 decision tool.

## Features
- **OccHealth Consultant**: AI-powered chat for occupational health questions (10 free questions, then $29/month subscription)
- **OSHA 300, Log it or Not**: Interactive decision tree for OSHA recordability
- **Lead Capture**: Free recordability cheat sheet download

## Tech Stack
- Frontend: React + Vite + TailwindCSS + shadcn/ui
- Backend: Express + Node.js
- Database: PostgreSQL with Drizzle ORM
- AI: Anthropic Claude via Replit AI integration
- Auth: Replit Auth

## Pending Setup
- **Stripe Integration**: User dismissed Stripe setup. When ready to accept payments for the $29/month OccHealth Consultant subscription, set up Stripe via Replit integrations or provide Stripe API keys as secrets.

## Recent Changes
- Renamed "AI Consultant" to "OccHealth Consultant"
- Renamed "Decision Trees" to "OSHA 300, Log it or Not"
- Implemented 10 free questions limit with paywall for OccHealth Consultant
- Added question usage tracking in database

## User Preferences
- Large logo display preferred
- Focus on Occupational Medicine terminology
