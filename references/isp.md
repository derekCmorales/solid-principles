# ISP — Interface Segregation Principle

## Enunciado canónico

Robert C. Martin, a partir del sistema de impresoras Xerox (años 80–90); *Clean Architecture* (2017), cap. 10.

Ningún cliente debe depender de métodos que no usa. La versión moderna importa más a **dependencias y build**: depender de un módulo grande por una función pequeña te obliga a recompilar, redesplegar o actualizar por cambios que no te afectan.

Conecta con el **Common Reuse Principle**: no fuerces a los clientes a depender de cosas que no reutilizan.

## Qué NO significa

No significa "una interface por clase" ni "segregar hasta un método". Segregar sin clientes distintos es ruido. En TypeScript, partir un `type` por estética no cambia el runtime y casi nunca el bundle si todo vive en el mismo paquete.

## Síntomas de violación

- Clases con métodos vacíos o `throw new Error("not implemented")` para satisfacer un tipo gordo.
- Un `UserRepository` con 20 métodos; el login usa dos.
- Barrel `index.ts` que reexporta el módulo entero; un cambio en PDF rompe el typecheck de auth.
- En NestJS: `AuthModule` importa `UsersModule` completo (que arrastra Prisma, mail, S3) para leer un email.
- En monorepos: `import { x } from "@app/core"` tira de todo el barrel.

En lenguajes de tipado estático (TypeScript, Java, C#) el daño es real: el compilador y el grafo de módulos acoplan. En lenguajes dinámicos el acoplamiento existe en runtime y en la cabeza del lector, pero no en tiempo de compilación.

## Ejemplo de violación

Xerox: un trabajo de impresión dependía de una clase que también conocía grapado, fax y encolado; un cambio de fax recompilaba a quien sólo imprimía.

```ts
// infra/printer.ts
export interface OfficeDevice {
  print(job: PrintJob): Promise<void>;
  fax(job: FaxJob): Promise<void>;
  staple(job: PrintJob): Promise<void>;
  scan(): Promise<Buffer>;
}

export class CheckoutReceiptService {
  constructor(private readonly device: OfficeDevice) {}

  async receipt(order: Order): Promise<void> {
    await this.device.print(toReceipt(order));
    // nunca fax, never staple — pero el tipo y el módulo los arrastran
  }
}
```

Mismo olor con Prisma: un `PrismaService` inyectado como puerto de aplicación. El caso de uso de login "depende" del schema de facturas.

## Refactorización paso a paso

1. Lista clientes y los métodos que **cada uno** llama.
2. Extrae tipos estrechos por cliente (`Printer`, `SessionLookup`), no por estética.
3. La clase concreta puede implementar varios tipos (un adapter gordo detrás de puertos flacos).
4. En Nest/TS: exporta puertos desde el módulo de aplicación, no el `PrismaModule` entero.

```ts
export interface Printer {
  print(job: PrintJob): Promise<void>;
}

export class CheckoutReceiptService {
  constructor(private readonly printer: Printer) {}

  receipt(order: Order) {
    return this.printer.print(toReceipt(order));
  }
}

export class XeroxCluster implements Printer, Fax, Scanner {
  print(job: PrintJob) { /* ... */ }
  fax(job: FaxJob) { /* ... */ }
  scan() { /* ... */ }
}
```

## Costo de aplicarlo

Más interfaces. En TS son baratas (se borran al emitir), pero el lector ve más nombres. Segregar de más produce un archivo por método.

## Cuándo NO aplicarlo

- Un solo cliente usa todos los métodos.
- El "módulo grande" es un paquete interno de tres funciones que siempre versionan juntas.
- Partir un DTO de 8 campos en 8 types no es ISP; es ruido.

## Componente y arquitectura

ISP a escala es el grafo de paquetes: `apps/web` no debería importar `apps/api` para un tipo de 10 líneas (saca un `packages/domain`). Un cambio de Resend no debe invalidar el cache de Typecheck del frontend. En Nest, módulos que reexportan de más violan ISP a nivel de DI: el injector construye un grafo que el cliente no pidió.
