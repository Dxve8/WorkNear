# WorkNear — Hyperlocal Employment & Workforce Matching Platform

MERN stack MCA project that connects local businesses with nearby job seekers based on **skills, availability, distance, salary and experience**.

## Features

- Role-based auth (Job Seeker / Business / Admin)
- Worker profiles with weekly availability & preferred radius
- Business profiles & job posting (including Urgent hiring)
- Job browse / search / filter
- **Explainable matching engine** (TF-IDF + cosine similarity + rules)
- Recommended jobs ranked by match score
- Application workflow (Applied → Viewed → Shortlisted → Interview → Selected)
- Saved jobs
- Admin dashboard, moderation & local skill-demand analytics
- Fully responsive (Bootstrap 5)

## Tech Stack

- **Frontend**: React + Vite, React Router, Axios, Bootstrap 5
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt
- **Matching**: `natural` library (TF-IDF + cosine) + custom scoring

## Quick Start

### 1. Backend

```bash
cd server
npm install
# Edit .env if needed (MongoDB URI, JWT secret)
npm run dev          # http://localhost:5000
```

Seed demo data:
```bash
npm run seed
```

Demo accounts after seeding:
- Seeker: `rahul@example.com` / `password123`
- Business: `abc@cafe.com` / `password123`
- Admin: `admin@worknear.com` / `admin123`

### 2. Frontend

```bash
cd client
npm install
npm run dev          # http://localhost:5173
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET/PUT | /api/workers/profile | Worker profile |
| POST/GET | /api/business | Business profile |
| POST/GET | /api/jobs | Create / list jobs |
| GET | /api/jobs/recommended | Ranked recommendations |
| GET | /api/jobs/:id/match | Match score + reasons |
| POST | /api/jobs/:id/apply | Apply |
| GET | /api/applications/my | My applications |
| GET | /api/jobs/:id/applicants | Applicants (business) |
| PUT | /api/applications/:id/status | Update status |
| GET | /api/admin/stats | Admin stats |
| GET | /api/admin/skills-demand | Skill demand |

## Matching Weights

- Skill / text similarity — 50%
- Distance — 20%
- Experience — 10%
- Salary compatibility — 10%
- Availability — 10%

Every score is accompanied by human-readable reasons.

## Project Structure

See `server/` and `client/src/` for clean modular layout.

## License

MCA Academic Project
