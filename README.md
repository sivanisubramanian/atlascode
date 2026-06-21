# ATlas — Athletic Training Learning System

ATlas is a structured learning platform built for student athletic trainers. It provides a clear curriculum and interactive lessons for students who are learning independently alongside a supervising AT.

## What It Does

Student athletic trainers often have no structured curriculum to follow. They're expected to learn on the job, but supervising ATs are too busy to hand-hold, and there's no single resource that tells students what to learn or in what order.

ATlas solves this by providing:

- **Structured lesson modules organized by level**
  - Level 1 — Foundations of Sports Medicine
  - Level 2 — Essential Clinical Skills
  - Level 3 — Advanced Athlete Care
- **Interactive lessons** with definitions, diagrams, and embedded videos, broken into bite-sized pages students click through at their own pace
- **Progress tracking** so students always know what they've completed, with progress saved automatically and synced live to Firestore
- **A Student View mode for teachers** — teachers can preview the exact lesson experience their students see, navigating through any module's pages without their progress (or the student's) being affected

## Curriculum

16 modules across three levels:

**Level 1 — Foundations of Sports Medicine**
Common Medical Terminology, Ankle Anatomy, Knee Anatomy, Shoulder Anatomy, Wrist Anatomy

**Level 2 — Essential Clinical Skills**
Basic Taping, Basic Wound Care, Concussions, Allergic Reactions, Heat-Related Health Problems

**Level 3 — Advanced Athlete Care**
Bloodborne Pathogens, Emergency Plan, Modalities, Exercise-Induced Asthma, The Athlete with Diabetes, Special Medical Concerns for Adolescent Athletes

New modules are added by dropping content into a single config-driven list — the dashboard, sidebar, teacher view, and progress tracking all pick it up automatically.

## Authentication & Roles

ATlas uses **Firebase** (Firebase Authentication + Firestore) for login and data storage.

- Users sign in with **email and password**, selecting either the **Student** or **Teacher** role at login.
- **Students** see their personal dashboard with all 16 modules, click into any lesson, and have their progress saved automatically to Firestore as they go.
- **Teachers** see a Student Progress Tracker dashboard listing every student account, with a per-student breakdown of completion across all 16 modules.
- Teachers also have access to **Student View**, which renders the exact same dashboard and lesson pages a student sees, for previewing content without affecting saved progress.

## Tech Stack

- Plain HTML, CSS, and JavaScript (`index.html`) — no build step or framework
- Firebase Authentication and Cloud Firestore (`firebase-logic.js`) for accounts and progress data

## About

Built by a high school student athletic trainer to fill a gap that every student AT experiences — no roadmap, no curriculum, no structured way to learn independently. Designed to be used alongside a supervising certified AT.

&copy; 2026 Sivani Subramanian. All rights reserved.