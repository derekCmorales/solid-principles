# TypeScript y frameworks

SOLID no cambia. El sistema de tipos y los frameworks sí cambian **cómo se ve** una violación. Lee esto cuando el repo sea NestJS, Fastify, Express, Next.js, Prisma o React.

## Tipado estructural y LSP

`implements PaymentGateway` es documentación. Cualquier objeto con `charge()` compila. LSP se demuestra con tests de contrato y con la ausencia de `instanceof` en el cliente, no con el `implements`.

`class Square extends Rectangle` falla igual que en Java. Una unión (`type Rect = { kind: "rect"; w: number; h: number } | { kind: "square"; side: number }`) evita fingir subtipos.

Casteos `as`, `as never`, `as any` en el composition root para "cerrar el tipo" son olor de DIP/LSP: el puerto y el concreto no coinciden.

## Interfaces vs clases abstractas

Prefiere `interface` / `type` para puertos: no emiten JS, no arrastran jerarquía. Una `abstract class` sólo si hay comportamiento compartido real (no un método vacío).

No envuelvas `string`, `Date`, `Map`, `Promise`, `Error`. DIP lo exceptúa.

## NestJS

El contenedor **no es** DIP. `@Injectable()` + `@Inject(PrismaService)` en un use case viola DIP: hay DI hacia el detalle.

Patrón sano: el módulo de aplicación declara el puerto (`ORDER_REPOSITORY`); el módulo de infra `provide` el mapper Prisma. El use case inyecta el token, no `PrismaService`.

Un `UsersModule` que exporta el servicio gordo entero para que `AuthModule` lea un email viola ISP. Exporta un `UserLookup` de dos métodos.

Guards, pipes e interceptors son IoC del framework (el framework llama tu código). Úsalos en el borde HTTP, no como sitio de reglas de negocio.

## Fastify / Express

Si el interactor recibe `FastifyRequest`, el dominio depende del framework. Mapea a un DTO plano en el controller.

El `main.ts` / composition root es el lugar correcto para `new PrismaClient()`, `new Resend()`, `jose`. Si eso aparece en un generator/service de dominio, es DIP.

## Prisma

`PrismaClient` es concreto volátil (el schema cambia con cada migración). No es `Date`. El mapper (`ElfAccountMapper`) implementa un gateway del dominio y traduce records ↔ entities. El dominio no importa `@prisma/client`.

## Next.js / React

Server Actions y Route Handlers son controllers. SQL + descuentos + `resend.emails.send` en el mismo `action.ts` es SRP+DIP rotos.

Un hook `useOrders()` que llama a Stripe desde el cliente mezcla UI con un detalle de pagos. El puerto de pagos vive en servidor.

Componentes que importan `PrismaClient` (aunque sea en RSC) acoplan el árbol de UI al schema. Data fetching detrás de un puerto/repository.

## Monorepo y barrels

`export * from "./pdf"` en `packages/core` hace que un cambio de PDF invalide Typecheck de auth (ISP a nivel de paquete). Exporta subpaths (`@app/core/auth`, `@app/core/pdf`) o paquetes separados.

## Tests

Un test unitario del caso de uso que mockea `PrismaClient` (cientos de métodos) es ISP+DIP: mockea el puerto de 3 métodos. Los tests de contrato del adapter (Prisma real en integración) son el sitio del SQL.
