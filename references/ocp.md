# OCP — Open-Closed Principle

## Enunciado canónico

Bertrand Meyer, *Object-Oriented Software Construction* (1988), p. 23: las entidades software deben estar **abiertas a extensión y cerradas a modificación**. Robert C. Martin lo retoma en *Clean Architecture* (2017), cap. 8.

El objetivo real: una extensión simple del requerimiento no debe forzar un cambio masivo. Se logra combinando SRP (separar lo que cambia por razones distintas) con DIP (orientar las dependencias hacia lo que debe quedar estable).

Regla operativa: **si el componente A debe protegerse de los cambios en B, entonces B debe depender de A**. Eso crea una jerarquía de protección: las reglas de negocio (interactor) son lo más protegido; las vistas, lo menos.

## Qué NO significa

No significa "nunca edites un archivo". El código nuevo también se modifica. Significa que el **núcleo ya cerrado** no se reabre por cada variante de presentación, proveedor o canal.

No se cumple añadiendo un `else if` en el centro del sistema. Eso es extensión por modificación.

## Síntomas de violación

- Cada nuevo formato/proveedor/canal toca el mismo `switch` en el caso de uso.
- El reporte financiero, el checkout o el login crecen en ramas por tipo.
- Tests del dominio se rompen cuando cambias una vista HTML o un SDK.
- En NestJS: un `Service` con `if (channel === "email")` / `"sms"` / `"push"`.

## Ejemplo de violación

Reporte financiero que debe verse en web y también imprimirse. El interactor calcula; si también arma HTML, añadir papel obliga a editar el núcleo (*Clean Architecture*, cap. 8 — parafraseado). Idealmente cambian **cero líneas** del código existente.

```ts
// reports/financial-report.ts — el análisis se reabre por cada canal
export class FinancialReport {
  constructor(private readonly db: PrismaService) {}

  async run(period: Period, channel: "web" | "print"): Promise<void> {
    const rows = await this.db.entry.findMany({ where: { period } });
    const summary = summarize(rows); // regla de negocio
    if (channel === "web") {
      await renderHtml(summary);
    } else {
      await sendToPrinter(summary);
    }
  }
}
```

Añadir CSV o un dashboard Next.js modifica `FinancialReport`.

## Refactorización paso a paso

1. Separa el dato analizado (modelo de reporte) de cómo se muestra.
2. El interactor depende de un puerto `ReportPresenter`.
3. Web, papel, CSV son adapters. La segunda implementación justifica el puerto; la tercera entra sin tocar el interactor.

```ts
export interface ReportPresenter {
  present(summary: FinancialSummary): Promise<void>;
}

export class GenerateFinancialReport {
  constructor(
    private readonly entries: LedgerEntries,
    private readonly presenter: ReportPresenter,
  ) {}

  async execute(period: Period): Promise<void> {
    const rows = await this.entries.forPeriod(period);
    await this.presenter.present(summarize(rows));
  }
}

export class WebReportPresenter implements ReportPresenter { /* HTML */ }
export class PrintReportPresenter implements ReportPresenter { /* spooler */ }
```

En Fastify/Nest el composition root elige el presenter. El interactor no conoce HTTP ni impresoras.

Las interfaces intermedias cumplen **dos** funciones distintas:

- **Control direccional**: invertir una dependencia (el reporte no depende de Prisma ni de React).
- **Ocultamiento de información**: el cliente no toma dependencias transitivas hacia detalles que no usa (no importar `puppeteer` porque el PDF vive detrás del puerto).

## Costo de aplicarlo

Un puerto, N adapters, wiring. Si la variante es única y estable, el `if` de dos ramas es más barato. OCP mal aplicado produce una estrategia por cada `boolean`.

## Cuándo NO aplicarlo

- Una sola vía de salida y ningún requerimiento de la segunda.
- Conjunto cerrado y minúsculo (`"json" | "text"` en un CLI interno).
- La tercera pasarela es hipotética: no abras el diseño por ella. Implementa las dos reales; deja un comentario, no un `PaymentGateway` de tres métodos vacíos.

## Componente y arquitectura

Protege hacia adentro: entidades e interactors estables; controllers, presenters y gateways volátiles. Un cambio de Next.js a otro renderer no debe recompilar el dominio. A nivel de componente, los módulos de reglas no dependen de los módulos de UI ni de infra.
