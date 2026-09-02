---
name: solid-principles
description: Aplica, audita y explica los principios SOLID (SRP, OCP, LSP, ISP, DIP) en cualquier lenguaje orientado a objetos. Úsala siempre que el usuario mencione SOLID, SRP, OCP, LSP, ISP, DIP, "principio de responsabilidad única", inversión de dependencias, acoplamiento, cohesión, arquitectura limpia, code smells, deuda técnica, refactorización de clases grandes, "God object", revisión de diseño, o cuando pida diseñar/revisar clases, interfaces, módulos o capas — aunque no nombre SOLID explícitamente. Úsala también en code reviews de diseño OO y al decidir dónde poner una abstracción. En TypeScript (NestJS, Fastify, Express, Next.js, Prisma, React) úsala al revisar services, providers, módulos, puertos, gateways, composition roots, o al decidir si extraer una interface.
---

# Principios SOLID

Audita, refactoriza, diseña y explica SRP, OCP, LSP, ISP y DIP. El quinto modo es frenar el sobre-diseño: la patología más cara no es ignorar SOLID, es aplicarlo de forma prematura hasta convertir el código en un laberinto de interfaces con una sola implementación.

Todo el código de ejemplo es TypeScript. Traduce el mismo diseño al lenguaje del repo si no es TS. Para trampas del sistema de tipos, NestJS, Prisma y Next.js, lee [references/typescript.md](references/typescript.md).

No copies texto de libros. Parafrasea y cita capítulo. Fuentes: [references/sources.md](references/sources.md).

## Definiciones canónicas

| Principio | Enunciado operativo | No es |
|-----------|---------------------|--------|
| **SRP** | Un módulo es responsable ante un solo actor (grupo que pide el mismo tipo de cambio). | "Una clase hace una sola cosa." Eso es tamaño de función, no SOLID. |
| **OCP** | Extender un requerimiento no debe forzar un cambio masivo del código existente. | Añadir `if`/`switch` por cada variante nueva. |
| **LSP** | Un subtipo es sustituible por el tipo base sin romper a los clientes. | "Hereda y listo": `implements` en TS no garantiza el contrato. |
| **ISP** | Ningún cliente depende de métodos (ni de un módulo de build) que no usa. | Partir interfaces por estética, sin clientes distintos. |
| **DIP** | El código de alto nivel depende de abstracciones; los detalles dependen de ellas. | Inyectar todo, ni envolver `Date`/`Array`/la stdlib. |

Citas históricas y malinterpretaciones: un archivo por principio, más abajo.

## Cuándo leer qué

Empieza por el síntoma, no por el acrónimo.

| Si observas… | Lee |
|--------------|-----|
| Una clase que cambia por razones distintas; dos equipos tocan el mismo archivo; duplicación "accidental" que al arreglarla para un actor rompe a otro | [references/srp.md](references/srp.md) |
| Cada variante nueva (PDF, otro proveedor, otro canal) exige editar el núcleo; `switch` de tipos en reglas de negocio | [references/ocp.md](references/ocp.md) |
| `instanceof`, `switch (type)`, un subtipo que lanza o ignora métodos del padre; Square/Rectangle; un proveedor que no cumple el mismo contrato | [references/lsp.md](references/lsp.md) |
| Un cliente implementa métodos vacíos; un barrel/`index.ts` obliga a recompilar por cambios ajenos; un módulo Nest importa otro entero por una función | [references/isp.md](references/isp.md) |
| Un interactor importa Prisma, Stripe o Fastify; `new` de detalles volátiles en reglas de negocio; tests que no pueden fake-ear I/O | [references/dip.md](references/dip.md) |
| Lista síntoma → principio → refactor | [references/smells-to-principle.md](references/smells-to-principle.md) |
| Interfaces 1:1 con clases, capas anémicas, DI como religión, wrapping de stdlib | [references/anti-patterns.md](references/anti-patterns.md) |
| El usuario está a punto de aplicar SOLID donde el costo supera el beneficio | [references/critiques.md](references/critiques.md) |
| Particularidades de TypeScript y sus frameworks | [references/typescript.md](references/typescript.md) |
| Checklist imprimible de review | [assets/review-checklist.md](assets/review-checklist.md) |

## Workflow

Trabaja en este orden. Cada paso existe para no inventar diseño.

1. **Leer antes de juzgar.** Identifica el dominio, los actores reales (quién pide cambios: finanzas, ops, el equipo de notificaciones, el de autenticación) y qué archivos ya cambian con frecuencia. SOLID sin ejes de cambio es adivinación: una interfaz "por si acaso" no protege nada.

2. **Nombrar el síntoma, no el principio.** Empieza por lo observable ("esta clase se modifica en el 70% de los PRs", "hay un `if (provider === 'stripe')` en el use case"). Sólo después mapea al principio. Si no puedes señalar archivo, clase y método, no hay hallazgo.

3. **Priorizar por dolor real.** Ordena por frecuencia de cambio × radio de impacto × riesgo. Reporta primero lo que más cuesta. Un God object que nadie toca es P3; un `switch` en el checkout que se edita cada sprint es P1.

4. **Proponer el refactor mínimo** que cierra ese dolor. Si introduces más de una abstracción nueva, justifica cada una con un cambio ya ocurrido o ya anunciado (segunda implementación real, requerimiento escrito). Lo hipotético no cuenta.

5. **Declarar el costo.** Toda propuesta suma archivos, indirección y dificultad para seguir el flujo. Dilo en la misma ficha que el beneficio. El usuario decide con ambos lados visibles.

6. **Si no hay violación, decirlo.** No rellenes el reporte. Un módulo cohesivo con una implementación y un actor es un resultado correcto, no un fallo de la auditoría.

## Formato de auditoría

Usa esta plantilla. Severidad: **P1** rompe o romperá algo; **P2** duele en cada cambio del eje; **P3** mejora cosmética.

```markdown
## Auditoría SOLID — [módulo/archivo]

### Resumen
[2-3 líneas: estado general y el hallazgo más costoso]

### Hallazgos

#### [P1] Violación de [PRINCIPIO] — `Ruta/Archivo.ext:línea`
**Síntoma observado:** [evidencia concreta]
**Por qué importa:** [consecuencia en términos de mantenimiento, no de teoría]
**Actores/ejes de cambio involucrados:** [...]
**Refactor propuesto:** [descripción + código]
**Costo:** [qué complejidad añade]
**Esfuerzo:** S / M / L

### Lo que está bien
[Decisiones de diseño correctas que no hay que tocar]

### Explícitamente NO recomendado
[Abstracciones que parecen faltar pero serían especulativas]
```

En refactors, muestra antes/después en TypeScript del stack del repo (NestJS, Fastify, Next, Prisma). No uses `Shape`/`Animal`.

## Diseñar módulos nuevos

1. Lista actores y ejes de cambio **ya conocidos**.
2. Pon las reglas de negocio detrás de un puerto (interface TypeScript). Los adapters (Prisma, Resend, Stripe, Fastify) implementan el puerto.
3. Compón en un composition root / `AppModule` / factory. El dominio no hace `new PrismaClient()`.
4. No extraigas interface hasta tener dos implementaciones reales o un requerimiento anunciado de la segunda.
5. Prefiere uniones discriminadas a jerarquías de clases cuando el conjunto de variantes es cerrado y estable.

## Enseñar

Explica el principio con el dominio del proyecto, no con figuras geométricas. Incluye siempre: enunciado, qué no significa, un síntoma en su código, y cuándo no aplicarlo. Si el usuario pregunta "qué es SRP", responde con el actor, no con "una sola cosa".

## Frenar el sobre-diseño

Antes de extraer una abstracción, responde:

- ¿Hay un segundo cliente o una segunda implementación **hoy**, no en un roadmap vago?
- ¿El tipo es volátil (SDK, ORM, pasarela) o estable (`string`, `Date`, `Map`)?
- ¿El costo (archivos, DI, tests de wiring) es menor que el dolor actual?

Si alguna respuesta es no, no extraigas. Lee [references/anti-patterns.md](references/anti-patterns.md) y [references/critiques.md](references/critiques.md) y dilo en "Explícitamente NO recomendado".
