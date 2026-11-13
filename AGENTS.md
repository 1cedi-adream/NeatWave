# Project Instructions — Fresh & Fold

## Primary Development Standard

For every frontend development, UI modification, refactoring, or visual design task, the agent MUST strictly follow:

**React Handbook — Project Standards**
https://reacthandbook.dev/project-standards

Treat this handbook as the primary reference for frontend architecture, project structure, component organization, coding conventions, and best practices.

Do not introduce alternative architectural patterns when they conflict with the React Handbook.

## Design Guidelines

Before editing any frontend or visual design code, the agent MUST read and follow:

`DESIGN_SKILLS.md`

This file defines the Fresh & Fold visual identity, Tailwind CSS conventions, page-specific interfaces, accessibility, responsive behavior, and design consistency.

## Mandatory Agent Workflow

Before implementing any frontend task:

1. Read the React Handbook project standards: https://reacthandbook.dev/project-standards.
2. Read `DESIGN_SKILLS.md`.
3. Inspect the existing project structure and understand its conventions.
4. Identify the appropriate feature, components, hooks, and utilities.
5. Implement the requested changes using the handbook's recommended architecture.
6. Maintain Fresh & Fold's established visual direction.
7. Verify TypeScript, linting, responsiveness, accessibility, and build requirements where applicable.

## Strict Requirements

- Follow the React Handbook consistently.
- Respect the existing project architecture.
- Keep code modular, reusable, and maintainable.
- Use feature-based organization where recommended by the handbook.
- Avoid unnecessary abstractions, dependencies, and duplicated code.
- Follow established TypeScript and React conventions.
- Preserve existing functionality unless explicitly asked to change it.
- Respect user-provided designs and requirements.
- Never modify frontend code before reviewing the required project guidelines.

**Priority:** User requirements → React Handbook project standards → Existing project conventions → `DESIGN_SKILLS.md` for visual and UI implementation.

These instructions apply to every frontend task throughout the repository.