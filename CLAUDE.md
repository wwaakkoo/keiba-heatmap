# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Package Manager**: Use `pnpm` for all package operations

**Core Commands**:

- `pnpm dev` - Start development server
- `pnpm build` - Build for production (TypeScript compilation + Vite build)
- `pnpm lint` - Run ESLint (with TypeScript extensions)
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check formatting without fixing

**Testing**:

- `pnpm test` - Run tests with Vitest
- `pnpm test:ui` - Run tests with UI interface
- `pnpm test:coverage` - Generate test coverage report
- Test files: `*.test.ts`, `*.test.tsx` in `__tests__` directories or alongside source files
- Test setup: `src/test/setup.ts`

**Git Workflow**:

- Uses Conventional Commits (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`)
- `pnpm commit` - Interactive commit with Conventional Commits format
- Husky pre-commit hooks run lint and format checks
- lint-staged configured for automatic formatting

## Architecture Overview

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: IndexedDB via Dexie.js for local data persistence
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + Testing Library + jsdom

### Project Structure

```
src/
├── components/     # Reusable UI components (common/ + ui/)
├── features/       # Feature-based modules (data-input/, etc.)
├── hooks/          # Custom React hooks
├── services/       # Business logic and data layer
├── stores/         # State management
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── constants/      # Application constants
```

### Key Architectural Patterns

**Feature-Based Organization**: Each feature in `src/features/` contains:

- `components/` - Feature-specific UI components
- `hooks/` - Feature-specific custom hooks
- `schemas/` - Zod validation schemas
- `__tests__/` - Feature tests

**Database Layer**:

- `HorseRacingDB` class extends Dexie for IndexedDB operations
- Repository pattern in `src/services/repositories/`
- Singleton database instance exported as `db`

**Type System**:

- Core domain types in `src/types/core.ts` (Race, Horse, Prediction, etc.)
- Enums in `src/types/enums.ts`
- Parser types in `src/types/parser.ts`
- Validation types with Zod schemas

**Data Processing**:

- NetKeibaParser for parsing horse racing data from copied text
- Error reporting system with detailed validation
- Parser configuration for strict/loose parsing modes

### Component Patterns

**UI Components**: Located in `src/components/ui/` following shadcn/ui patterns

- Import path alias: `@/components/ui/button`
- Uses class-variance-authority for styling variants
- Tailwind CSS with clsx/tailwind-merge utilities

**Common Components**: In `src/components/common/`

- AppShell, Header, Navigation, PageContainer
- ErrorBoundary for React error handling
- Loading states and skeletons

**Form Handling**:

- React Hook Form with Zod resolvers
- Multi-step wizards (see `useRaceInputWizard`)
- Validation schemas co-located with features

### Database Schema

**Tables**:

- `races` - Race information with composite indices
- `horses` - Horse data linked to races
- `predictions` - Prediction results with timestamps
- `investments` - Investment tracking and results
- `settings` - Key-value application settings

**Key Relations**:

- Race → Horses (one-to-many via raceId)
- Race → Predictions (one-to-many)
- Race → Investments (one-to-many)

## Path Aliases

- `@/` maps to `src/`
- Use absolute imports: `import { Button } from '@/components/ui/button'`

## Code Style Notes

- Japanese comments and descriptions in domain code
- English for technical/framework code
- Strict TypeScript configuration
- Prettier + ESLint with React and TypeScript extensions
