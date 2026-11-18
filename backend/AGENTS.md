# AGENTS.md

## 1. Architecture

- Use a modular, feature-based architecture.
- Organize code around business domains (e.g. users, orders, transactions).
- Keep routes, controllers, services, schemas, and types separate.
- Avoid unnecessary abstractions and overengineering.

### Folder Structure

```text
src/
├── modules/
│   └── feature/
│       ├── feature.routes.ts
│       ├── feature.controller.ts
│       ├── feature.service.ts
│       ├── feature.schema.ts
│       └── feature.types.ts
├── db/
│   ├── schema.ts
│   └── index.ts
├── middleware/
├── utils/
├── config/
├── app.ts
└── server.ts
```

## 2. Technology Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **ORM:** Drizzle ORM
- **Database:** Neon Serverless PostgreSQL
- **Validation:** Zod

Use the existing project dependencies and conventions. Do not introduce alternative libraries without a good reason.

## 3. Coding Standards

- Use TypeScript throughout.
- Avoid `any`; always define proper types.
- Write small, focused, reusable functions.
- Keep files relatively short and responsibilities clearly separated.
- Prioritize readable, maintainable, junior-friendly code.
- Avoid unnecessary complexity and premature abstractions.

## 4. Separation of Responsibilities

| Layer       | Responsibility                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Routes      | Define endpoints and attach middleware.                                                                 |
| Controllers | Handle HTTP requests and responses.                                                                     |
| Services    | Contain business logic.                                                                                 |
| Schemas     | Define Zod schemas for validating incoming request data, especially request bodies.                     |
| Types       | Define DTOs (Data Transfer Objects) for structured data passed between application layers and services. |
| DB          | Handle Drizzle queries and database schema definitions.                                                 |

## 5. Validation

- Use Zod for request body validation.
- Keep validation schemas in the respective feature's `*.schema.ts` file.
- Validate incoming data before it reaches controllers or services.
- Never trust client-provided data.
- Reuse inferred Zod types where appropriate instead of duplicating type definitions.

## 6. Error Handling

- Implement a centralized global error-handling middleware.
- Register the error handler after all application routes and middleware.
- Avoid handling errors independently in every controller.
- Use a consistent error response structure.
- Use appropriate HTTP status codes and meaningful error messages.
- Handle known application errors explicitly.
- Handle Zod validation errors and Drizzle/database errors appropriately.
- Pass errors to the global handler using Express's `next(error)` mechanism where appropriate.
- Never expose internal stack traces, database details, or sensitive information in production responses.

## 7. Database

- Use Drizzle ORM for all database interactions.
- Use Neon PostgreSQL as the database provider.
- Define database tables and relationships using Drizzle schema definitions.
- Keep database configuration and connection initialization inside `src/db/`.
- Use Drizzle migrations to manage database schema changes.
- Avoid raw SQL unless necessary; prefer Drizzle's query builder.
- Keep database operations out of controllers. Put them in services or dedicated database utilities where appropriate.

## 8. General Principles

- Keep business logic out of routes and controllers.
- Validate incoming data before processing it.
- Reuse existing utilities and patterns where appropriate.
- Maintain consistency across modules.
- Do not create unnecessary files, layers, interfaces, or abstractions.
- Before introducing a new pattern, check whether an existing project pattern already solves the problem.
- When implementing features, follow the established architecture rather than taking shortcuts.

**Core principle:** Write clean, modular, strongly typed, junior-friendly code. Prioritize simplicity, consistency, and maintainability over unnecessary abstraction.
