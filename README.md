# solid-principles

[![skills.sh](https://skills.sh/b/derekCmorales/solid-principles)](https://skills.sh/derekCmorales/solid-principles)

Agent skill para **auditar, refactorizar, diseñar y explicar** SRP, OCP, LSP, ISP y DIP — y para **frenar el sobre-diseño** (interfaces especulativas, DI como religión, SRP atomizado).

Ejemplos en **TypeScript** (NestJS, Fastify, Prisma, Next.js, React). Sigue el formato [Agent Skills](https://agentskills.io).

## Instalación (recomendado)

Usa el CLI del ecosistema [skills.sh](https://skills.sh). Detecta Cursor, Claude Code, Antigravity, Codex y [70+ agentes](https://github.com/vercel-labs/skills#supported-agents).

### Global (todos tus proyectos)

```bash
# Claude Code, Antigravity, Cursor y el resto de agentes detectados
npx skills add derekCmorales/solid-principles -g --all -y
```

Sólo algunos agentes:

```bash
npx skills add derekCmorales/solid-principles -g \
  -a claude-code -a antigravity -a cursor -y
```

### Por proyecto (compartido con el equipo)

```bash
npx skills add derekCmorales/solid-principles -y
```

### Verificar antes de instalar

```bash
npx skills add derekCmorales/solid-principles --list
```

### Rutas globales (referencia)

| Agente | Ruta global tras `npx skills add -g` |
|--------|--------------------------------------|
| Claude Code | `~/.claude/skills/solid-principles/` |
| Antigravity | `~/.gemini/antigravity/skills/solid-principles/` |
| Cursor | `~/.cursor/skills/solid-principles/` |
| Codex | `~/.codex/skills/solid-principles/` |

El CLI crea symlinks al mismo contenido canónico. Usa `--copy` si tu entorno no soporta symlinks.

## Aparecer en skills.sh

No hay registro manual. [skills.sh](https://skills.sh) indexa skills **públicos de GitHub** cuando alguien los instala con `npx skills add` (telemetría anónima de instalación). Tras la primera instalación global o de proyecto, la ficha suele publicarse en:

`https://skills.sh/derekCmorales/solid-principles/solid-principles`

El badge de arriba y el leaderboard se actualizan con el volumen de installs.

## Uso

El agente carga la skill cuando el `description` del frontmatter encaja (SOLID, God object, acoplamiento, revisión de diseño, interfaces en TypeScript, etc.). También puedes invocarla explícitamente en Cursor o Claude Code.

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
└── evals/                # Casos de prueba (no van en solid-principles.skill)
```

## Instalación manual (sin CLI)

```bash
git clone https://github.com/derekCmorales/solid-principles.git ~/.cursor/skills/solid-principles
# o ~/.claude/skills/solid-principles según tu agente
```

## Paquete `.skill`

`solid-principles.skill` es un zip para distribución manual (Cursor / skill-creator). Los `evals/` no se incluyen en ese paquete.

## Licencia

MIT — ver [LICENSE](LICENSE).
