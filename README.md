# solid-principles

[![skills.sh](https://skills.sh/b/derekCmorales/solid-principles)](https://skills.sh/derekCmorales/solid-principles)

Agent skill para **auditar, refactorizar, diseñar y explicar** SRP, OCP, LSP, ISP y DIP — y para **frenar el sobre-diseño** (interfaces especulativas, DI como religión, SRP atomizado).

Ejemplos en **TypeScript** (NestJS, Fastify, Prisma, Next.js, React). Sigue el formato [Agent Skills](https://agentskills.io).

## Instalación

```bash
npx skills add derekCmorales/solid-principles
```

El CLI de [skills.sh](https://skills.sh) detecta tu agente (Cursor, Claude Code, Antigravity, Codex, etc.) y te guía en el resto.

## Uso

El agente carga la skill cuando el `description` del frontmatter encaja (SOLID, God object, acoplamiento, revisión de diseño, interfaces en TypeScript, etc.). También puedes invocarla explícitamente.

Casos típicos:

- Auditar un `*Service` que mezcla persistencia, pagos y notificaciones
- Decidir si extraer un puerto antes de una segunda implementación
- Rechazar sobre-ingeniería en un CRUD pequeño

## Estructura

```
solid-principles/
├── SKILL.md              # Índice, workflow, plantilla de auditoría
├── references/           # Un archivo por principio + anti-patterns, critiques, TS
├── assets/               # Checklist de code review
└── evals/                # Casos de prueba
```

## Licencia

MIT — ver [LICENSE](LICENSE).
