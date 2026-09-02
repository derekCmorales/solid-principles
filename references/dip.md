# DIP — Dependency Inversion Principle

## Enunciado canónico

Robert C. Martin, "Design Principles and Design Patterns" (2000); *Clean Architecture* (2017), cap. 11.

- Los módulos de alto nivel no deben depender de los de bajo nivel; ambos dependen de abstracciones.
- Las abstracciones no dependen de detalles; los detalles dependen de abstracciones.

Reglas prácticas: no referirse a clases concretas **volátiles**; no derivar de clases concretas volátiles; no sobrescribir funciones concretas; no mencionar el nombre de algo concreto y volátil en el código de alto nivel.

**Excepción:** no se aplica a concretos **estables** (`string`, `Date`, `Map`, la stdlib, `Array.prototype.map`). Una interface alrededor de `Date.now()` o de `JSON.parse` es ruido, no diseño.

## Qué NO significa

DIP no es Inversión de Control (IoC) ni Inyección de Dependencias (DI). Se confunden siempre:

| Término | Qué es |
|---------|--------|
| **DIP** | Regla de dirección: el código fuente de alto nivel no importa detalles volátiles. |
| **IoC** | El flujo de control se invierte (framework llama tu código: Nest, React, Fastify hooks). |
| **DI** | Técnica para entregar colaboradores (constructor, parámetros, contenedor). |

Puedes tener DIP sin contenedor (factories, composition root a mano). Puedes inyectar `PrismaService` en el interactor y **violar** DIP: hay DI, la dependencia sigue apuntando al detalle.

La dirección de las dependencias de **código fuente** y la del **flujo de control** se oponen: el interactor llama al gateway (control hacia el detalle), pero el `import` apunta al puerto (fuente hacia la abstracción). Esa oposición es la "inversión".

## Síntomas de violación

- `import { PrismaClient } from "@prisma/client"` dentro de un caso de uso.
- `new Stripe(process.env.STRIPE_KEY)` en un service de dominio.
- Tests del checkout que levantan Postgres o pegan a Stripe.
- Nest: `@Inject(PrismaService)` en un provider que debería ser aplicación.
- Next.js: Server Action con SQL y reglas de descuento en el mismo archivo.
- `as never` / `as any` para colar un detalle donde el tipo pedía un puerto.

## Ejemplo de violación

```ts
export class ChargeOrder {
  async execute(orderId: string): Promise<void> {
    const prisma = new PrismaClient();
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.charges.create({ amount: order.totalCents, currency: "usd" });
    await prisma.order.update({ where: { id: orderId }, data: { status: "paid" } });
  }
}
```

Alto nivel (cobrar) depende de Prisma y Stripe por nombre. Un cambio de API de Stripe recompila y rompe la regla de negocio.

## Refactorización paso a paso

1. Declara puertos en el lado de la aplicación (`OrderRepository`, `PaymentGateway`, `Clock` sólo si el tiempo es un eje de test real).
2. Implementa adapters (`PrismaOrderMapper`, `StripePaymentGateway`).
3. Cruza la frontera de **creación** con un composition root o **Abstract Factory** cuando el concreto a construir depende de un detalle que el dominio no debe nombrar.
4. El flujo de control sigue siendo dominio → adapter; los `import` del dominio no mencionan Prisma.

```ts
export interface OrderRepository {
  get(id: OrderId): Promise<Order>;
  save(order: Order): Promise<void>;
}

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

export class ChargeOrder {
  constructor(
    private readonly orders: OrderRepository,
    private readonly payments: PaymentGateway,
  ) {}

  async execute(id: OrderId): Promise<void> {
    const order = await this.orders.get(id);
    const result = await this.payments.charge(order.chargeInput());
    this.orders.save(order.markPaid(result));
  }
}

// composition root (Fastify, main.ts, o Nest factory) — único lugar que nombra concretos
const charge = new ChargeOrder(
  new PrismaOrderMapper(prisma),
  new StripePaymentGateway(stripe),
);
```

Abstract Factory: cuando el adapter concreto se elige por config (`mailDriver: "console" | "resend"`), la factory vive en infra y devuelve el puerto `MailView`. El interactor no lee `process.env`.

## Costo de aplicarlo

Puertos, adapters, un root de composición, tests dobles. En Nest el contenedor esconde el grafo: hay que mirar el módulo para ver qué concreto se usa. Demasiados puertos con una implementación = [anti-patterns](anti-patterns.md).

## Cuándo NO aplicarlo

- Tipos estables de lenguaje y stdlib.
- Un script de una sola vez, un endpoint interno que morirá con el sprint.
- Una sola implementación y ningún test que necesite fake: espera a la segunda (OCP+DIP juntos).
- Envolver `fs`/`fetch` "por si un día cambiamos" sin evidencia.

## Componente y arquitectura

Las capas internas (entities, interactors) no importan frameworks. Controllers HTTP, Prisma, Resend, JWT viven fuera y apuntan hacia adentro. El composition root es el único sitio sucio — y debe serlo: ahí se nombra lo volátil para que el resto no lo haga.
