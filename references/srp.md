# SRP — Single Responsibility Principle

## Enunciado canónico

Robert C. Martin, *Agile Software Development: Principles, Patterns, and Practices* (2002); tratamiento moderno en *Clean Architecture* (2017), cap. 7.

Un módulo debe tener una sola razón para cambiar. La razón para cambiar son **personas**: el enunciado refinado es que **un módulo debe ser responsable ante un solo actor**. Un actor es un grupo de usuarios o stakeholders que solicita el mismo tipo de cambio (contabilidad, RR.HH., operaciones, el equipo de notificaciones).

## Qué NO significa

No significa "una clase hace una sola cosa" ni "una función por clase". Eso es cohesión de funciones a bajo nivel (extract function), no SOLID. Martin avisa exactamente de esta confusión: si se toma al pie de la letra, el diseño se atomiza en clases anémicas de un método que sólo delegan.

Tampoco significa "un archivo = un concepto del dominio". Varios métodos pueden convivir si **el mismo actor** los cambia juntos.

## Síntomas de violación

- El mismo archivo aparece en PRs de equipos distintos (finanzas vs. notificaciones vs. persistencia).
- Un cambio para un actor rompe silenciosamente a otro (**duplicación accidental**: lógica compartida que parecía común pero cada actor la interpreta distinto).
- Merges frecuentes en el mismo fichero por motivos no relacionados.
- Clase que valida, calcula impuestos, persiste, envía email y genera PDF.
- En NestJS: un `XxxService` inyectado en media aplicación que mezcla casos de uso.

## Ejemplo de violación

Nómina: tres actores tocan `Employee`. Contabilidad pide `calculatePay`, RR.HH. pide `reportHours`, DBAs piden `save`. Extraer `regularHours()` a un helper compartido parece DRY; cuando RR.HH. cambia el recuento de horas, la nómina se calcula mal (*Clean Architecture*, cap. 7 — parafraseado).

En TypeScript el mismo olor es un God object de pedidos:

```ts
// orders/order.service.ts — actores: pricing, persistencia, notificaciones, fiscal
@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailerService,
    private readonly pdf: PdfService,
  ) {}

  async checkout(input: CheckoutDto): Promise<Order> {
    this.assertItems(input);
    const tax = this.computeTax(input);       // fiscal
    const order = await this.prisma.order.create({ /* ... */ }); // persistencia
    await this.mail.send({ to: input.email, template: "order-paid" }); // marketing
    await this.pdf.renderInvoice(order);      // facturación
    return order;
  }
}
```

## Refactorización paso a paso

1. Nombra los actores (checkout/pricing, persistencia, email, PDF).
2. Separa datos de comportamiento en tipos que **no se conocen entre sí**.
3. Deja el caso de uso como orquestador delgado, o usa un Facade para que el controlador no instancie tres objetos.
4. Conserva en la clase original sólo la regla del actor más importante si el resto aún no duele.

```ts
export class CheckoutOrder {
  constructor(
    private readonly orders: OrderRepository,
    private readonly pricing: PricingPolicy,
  ) {}

  async execute(input: CheckoutInput): Promise<Order> {
    const total = this.pricing.quote(input);
    return this.orders.save(Order.create(input, total));
  }
}

// Facade: el HTTP no orquesta tres puertos
export class CheckoutFacade {
  constructor(
    private readonly checkout: CheckoutOrder,
    private readonly notifier: OrderNotifier,
    private readonly invoices: InvoiceRenderer,
  ) {}

  async execute(input: CheckoutInput): Promise<Order> {
    const order = await this.checkout.execute(input);
    await this.notifier.paid(order);
    await this.invoices.for(order);
    return order;
  }
}
```

`OrderNotifier` e `InvoiceRenderer` pueden fallar o cambiar de proveedor sin reabrir la política fiscal.

## Costo de aplicarlo

Más tipos, más wiring, más tests de orquestación. El flujo de un request deja de caber en un archivo. Si los "actores" son la misma persona, el extra no paga.

## Cuándo NO aplicarlo

- Un solo desarrollador, un solo eje de cambio, código de vida corta.
- Extraer métodos privados cohesivos basta; no hace falta una clase por método.
- Todavía no hay segundo actor: esperar evidencia (PRs, tickets) antes de partir.

## Componente y arquitectura

A nivel de componente reaparece como **Common Closure Principle**: clases que cambian juntas viven juntas. A nivel arquitectónico, los actores definen los **ejes de cambio** que originan los límites (casos de uso vs. persistencia vs. delivery). Un interactor no debería cambiar porque Resend cambió su payload.
