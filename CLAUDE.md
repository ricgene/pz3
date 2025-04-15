# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build client: `npm run build` (in client-agent directory)
- Dev client: `npm run dev` (in client-agent directory)
- Typecheck client: `npm run check` (in client-agent directory)
- Build server: `npm run build` (in server-agent directory)
- Dev server: `npm run dev` (in server-agent directory)
- Deploy server: `npm run deploy` (in server-agent directory)

## Code Style
- TypeScript: Use strict types, prefer interfaces for object shapes
- React: Functional components with TypeScript, prefer hooks
- Naming: PascalCase for components, camelCase for functions/variables
- Imports: Group by external libraries, then internal modules
- Paths: Use aliases (`@/*` for client, `@shared/*` for shared)
- Error handling: Always handle promises with try/catch
- Styling: Use Tailwind CSS utility classes

## Structure
- Monorepo with three main parts:
  - client-agent: React/TypeScript/Vite frontend
  - server-agent: Node.js/TypeScript backend
  - graph-agent: Python LangGraph agent