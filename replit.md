# Core Compliance Hub

## Overview
Occupational health and compliance platform featuring an AI-powered OccHealth Consultant and OSHA 300 decision tool.

## Features
- **OccHealth Consultant**: AI-powered chat acting as a Senior Occupational Health & Safety Compliance Expert, referencing OSHA 29 CFR 1904 and DOT 49 CFR Part 40
- **OSHA 300, Log it or Not**: Interactive decision tree for OSHA recordability
- **Lead Capture**: Free recordability cheat sheet download

## Pricing Structure (3-Tier)
| Tier | Price | Included | Best For |
|------|-------|----------|----------|
| Safety Starter | Free | 3 Questions/month | Small teams, one-off checks |
| Compliance Pro | $29/mo | 15 Questions/month + PDF Checklists | Growing companies |
| Unlimited Safety | $99/mo | Unlimited Questions + Audit Prep Tools | Safety Managers, large fleets |

## Tech Stack
- Frontend: React + Vite + TailwindCSS + shadcn/ui
- Backend: Express + Node.js
- Database: PostgreSQL with Drizzle ORM
- AI: Anthropic Claude via Replit AI integration
- Auth: Replit Auth

## Pending Setup
- **Stripe Integration**: Required for payment processing for the $29/mo and $99/mo tiers. Set up Stripe via Replit integrations.

## Recent Changes
- Updated hero messaging to new copy: "Stop Guessing. Start Complying."
- Changed free tier from 10 to 3 questions/month
- Added 3-tier pricing section on landing page
- Updated paywall messaging to reflect new tiers

## User Preferences
- Large logo display preferred
- Focus on Occupational Medicine terminology
- AI persona: Senior Occupational Health & Safety Compliance Expert
