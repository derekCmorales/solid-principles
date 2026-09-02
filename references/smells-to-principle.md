# Síntoma → principio → refactor

Usa esta tabla después de nombrar el síntoma (paso 2 del workflow). No audites "los cinco" en cada archivo.

| Síntoma observable | Principio | Refactor mínimo |
|--------------------|-----------|-----------------|
| Archivo tocado por equipos/razones distintas; God object (valida, persiste, mail, PDF) | SRP | Partir por actor. Facade si el cliente no debe ver las piezas. |
| Helper "DRY" compartido entre actores; un arreglo rompe al otro | SRP | Duplicar conscientemente o extraer políticas **por actor**, no un util global. |
| Cada proveedor/canal/formato añade un `if` en el caso de uso | OCP | Puerto + adapter. El `switch` de creación vive en el composition root. |
| Segunda vía de presentación (web + papel, JSON + email) edita el interactor | OCP | Presenter/view port. Cero líneas nuevas en el análisis. |
| `instanceof` / `switch (type)` / `constructor.name` en dominio | LSP | Contrato común cumplido **dentro** de cada adapter, o unión discriminada honesta. |
| Subtipo con `throw new Error("not supported")` | LSP / ISP | El tipo base está gordo o el subtipo no es un subtipo. Parte el puerto o deja de heredar. |
| Cliente implementa métodos vacíos de una interface gorda | ISP | Interface por cliente. Una clase puede implementar varias. |
| Import de barrel/módulo Nest entero por una función | ISP | Subpath, token de lookup, o paquete más chico. |
| Caso de uso importa Prisma, Stripe, Fastify, Resend | DIP | Puerto en aplicación, adapter en infra, wiring en root. |
| `new ConcreteVolatile()` en reglas de negocio | DIP | Inyectar el puerto. Abstract Factory si el concreto depende de config. |
| Tests de dominio que necesitan DB o red | DIP | Fake del puerto. Integración aparte para el mapper. |
| Interface 1:1 con una sola implementación y sin segunda prevista | (ninguno) | No extraer. Ver [anti-patterns.md](anti-patterns.md). |
| "¿Le pongo interface a cada clase del CRUD?" | (ninguno) | No. CRUD de 3 tablas con un actor no pide SOLID. [critiques.md](critiques.md). |
| `as never` / `as any` para encajar un colaborador | DIP / LSP | El puerto y el concreto no coinciden. Ajusta el tipo o el adapter. |
| Hook React / Server Action con SQL + cobro + UI | SRP + DIP | Action = controller; caso de uso + puertos detrás. |

## Prioridad

`dolor = frecuencia de cambio × radio de impacto × riesgo`. Un `if` en el checkout (P1) gana a un God object muerto (P3). Un wrapping de `Date` no entra al reporte.
