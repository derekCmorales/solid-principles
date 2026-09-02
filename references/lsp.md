# LSP — Liskov Substitution Principle

## Enunciado canónico

Barbara Liskov, "Data Abstraction and Hierarchy" (OOPSLA 1987); formalizado con Jeannette Wing en "A Behavioral Notion of Subtyping" (ACM TOPLAS, 1994). Martin lo incluye en *Clean Architecture*, cap. 9.

Los subtipos deben ser sustituibles por sus tipos base sin que el programa cliente se rompa. En términos de contrato:

- las precondiciones no se fortalecen
- las postcondiciones no se debilitan
- los invariantes se preservan
- no se lanzan excepciones nuevas que el cliente del tipo base no espera

## Qué NO significa

No significa "usa herencia" ni "si `implements Foo`, ya es un Foo". En TypeScript el tipado es estructural: un objeto con los mismos métodos **compila** aunque viole el contrato. LSP es comportamiento, no forma.

Tampoco se "arregla" con un `instanceof` en el cliente: eso confiesa que el subtipo no es sustituible.

## Síntomas de violación

- `instanceof`, `constructor.name`, o `switch (kind)` en código cliente del tipo base.
- Métodos no implementados: `throw new Error("not supported")`.
- Un subtipo ignora parte del contrato (`setWidth` que también cambia `height`).
- Adapters de terceros que no cumplen el mismo shape (otra URL, otro código de error) y obligan a un `if` con el nombre del proveedor.
- Tests del tipo base que fallan al pasar el subtipo.

## Ejemplo de violación

**Clásico (cuadrado/rectángulo).** Un `Rectangle` con `setWidth`/`setHeight` independientes. `Square extends Rectangle` rompe el invariante: cambiar un lado no puede dejar el otro igual. El cliente que asume `setWidth` sin tocar height deja de ser correcto.

**Arquitectónico (dispatch de taxis / pasarelas).** Tres proveedores de ride-hailing o de pagos. El puerto dice "POST a `endpoint` con `{ pickup, dropoff }`". Un proveedor usa otra forma de URL y otro JSON. El sistema acaba con `if (vendor === "acme")` en el dominio — el subtipo no es sustituible.

```ts
export interface DispatchClient {
  requestRide(job: RideJob): Promise<RideReceipt>;
}

export class GenericHttpDispatch implements DispatchClient {
  async requestRide(job: RideJob): Promise<RideReceipt> {
    return this.http.post("/rides", job);
  }
}

export class AcmeDispatch implements DispatchClient {
  async requestRide(job: RideJob): Promise<RideReceipt> {
    // viola el contrato: el cliente genérico no sabe que Acme exige path distinto
    throw new Error("use requestRideAcme()");
  }
}

// olor delator en el interactor
if (vendor === "acme") {
  await acme.requestRideAcme(job);
} else {
  await client.requestRide(job);
}
```

## Refactorización paso a paso

1. Escribe el contrato en términos de resultados, no de HTTP: entrada, salida, errores.
2. Cada adapter traduce **dentro** de sí al protocolo raro. El interactor llama un solo método.
3. Si un proveedor no puede cumplir el contrato, no es un subtipo: es otro puerto o un Result explícito.

```ts
export class AcmeDispatch implements DispatchClient {
  async requestRide(job: RideJob): Promise<RideReceipt> {
    const res = await this.http.post(`/v2/quote/${job.region}`, toAcme(job));
    return fromAcme(res);
  }
}

export class DispatchRide {
  constructor(private readonly client: DispatchClient) {}

  execute(job: RideJob) {
    return this.client.requestRide(job); // sin instanceof
  }
}
```

En TypeScript, uniones discriminadas son a menudo más honestas que clases:

```ts
type PaymentResult =
  | { ok: true; txnId: string }
  | { ok: false; reason: "declined" | "network" };
```

Todos los proveedores devuelven `PaymentResult`. Nadie lanza un error "sorprendente".

## Costo de aplicarlo

Adapters más gordos (la traducción vive ahí). A veces un tipo base mal elegido hay que **borrarlo** (Square no es un Rectangle). Tests de contrato por implementación.

## Cuándo NO aplicarlo

- No hay jerarquía ni varias implementaciones del puerto.
- Modelas datos, no comportamiento: un union `type Kind = "a" | "b"` con un mapper cerrado no necesita subtipos.
- Forzar un tipo base común entre dos APIs que no comparten contrato crea el `if` que querías evitar.

## Componente y arquitectura

Los plugins y los SDK de terceros son subtipos del puerto de aplicación. Si el composition root (o un `factory` Nest) tiene un `switch` por nombre de proveedor **y** el dominio también, el contrato se filtró. El `switch` de creación puede vivir en el root; el de comportamiento, no.
