# Críticas y límites

Un agente que sólo conoce la defensa de SOLID da consejos malos. Expón esto cuando el usuario esté a punto de aplicar SOLID donde no rinde (CRUD chico, prototipo, una sola implementación, código de vida corta).

## Los cinco no son la misma clase de cosa

Agruparlos fue una decisión de mnemónico, no una teoría unificada.

- **SRP** y **OCP** son heurísticas de diseño, vagas hasta que se nombra el actor o el eje de cambio.
- **LSP** es un teorema (casi) formal de teoría de tipos / subtipado conductual.
- **ISP** y **DIP** son reglas concretas de dependencias.

Tratarlos como un checklist de cinco casillas iguales produce hallazgos inventados: "falta interface" no es una violación de LSP.

## "Una sola razón para cambiar" no es falsable sola

Sin definir el actor, dos ingenieros discuten indefinidamente si "persistir" y "validar" son responsabilidades distintas. En la práctica el criterio es sociológico: **quién pide el cambio** y **qué PRs ya ocurrieron**, no una ontología de funciones. Si el equipo no puede nombrar dos actores, no hay hallazgo SRP.

## La crítica funcional

Muchos beneficios (aislamiento, tests, extensión) se obtienen con funciones puras, datos inmutables y composición, sin interfaces ni jerarquías. Un pipeline `validate → price → save` con tipos de datos y puertos como funciones (`type SaveOrder = (o: Order) => Promise<void>`) cumple DIP sin clases.

En TypeScript eso es idiomático y a menudo **más** simple que `class OrderServiceImpl`. No impongas clases para "cumplir SOLID".

## Qué responde Robert Martin

En entradas como "Solid Relevance" (2020, blog.cleancoder.com) mantiene que los principios son independientes del paradigma: también aplican a funciones y módulos. SRP sigue siendo "un actor"; OCP sigue siendo "no reabrir el núcleo". No concede que SOLID sea sólo OO ceremonial — pero sí insiste en no atomizar.

Cita esa posición cuando el usuario rechace SOLID por "ser de Java". Traduce a módulos y funciones; no abandones el criterio de actores y dirección de dependencias.

## Dónde el costo supera el beneficio

- Código de vida corta (spikes, demos, scripts de migración).
- Baja tasa de cambio: un módulo que no se tocó en un año no pide puertos.
- Un solo desarrollador, un solo despliegue, una sola implementación.
- CRUD de 3 tablas con el mismo actor (admin interno): Prisma en el controller puede ser aceptable si el dolor no existe.
- Prototipos cuyo eje de cambio real es "¿esto sirve?" no "¿cómo sustituyo Stripe?".

En esos casos el informe debe decir: no hay violación que pague el refactor. Ver plantilla, sección "Explícitamente NO recomendado".

## Heterogeneidad y sobreajuste pedagógico

SOLID se enseña con `Shape`/`Animal`. Esos ejemplos no tienen actores ni costo de cambio, así que entrenan a extraer interfaces de juguete. Por eso esta skill exige dominios reales (facturación, auth, pagos, ETL, notificaciones) y evidencia de PRs.

## Qué hacer con la crítica

No la uses para ignorar un God object que se rompe cada semana. Úsala para **no** extraer `IUserRepository` en un CRUD quieto. El output honesto es asimétrico: agresivo con el dolor real, tacaño con la ceremonia.
