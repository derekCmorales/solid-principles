# Anti-patrones: SOLID mal aplicado

La mayor patología no es ignorar SOLID. Es aplicarlo de forma prematura y especulativa. Si el usuario pide una de estas formas, dilo en "Explícitamente NO recomendado" y no lo implementes "por higiene".

## Interface bloat

Una `interface` por cada clase, todas con una sola implementación, sin perspectiva de tener otra.

```ts
export interface UserService { create(input: CreateUser): Promise<User>; }
export class UserServiceImpl implements UserService { /* única impl */ }
```

No invierte ninguna dependencia (el nombre `Impl` lo confiesa). Añade un archivo y un salto mental. Extrae el puerto cuando exista `PrismaUserMapper` **y** `InMemoryUserMapper`, o un segundo proveedor real.

## Explosión de clases anémicas

Capas de una-clase-un-método que sólo delegan: `OrderController` → `OrderFacade` → `OrderService` → `OrderManager` → `OrderRepository` → `OrderDao`. SRP atomizado. El flujo de un checkout no se puede seguir.

Si cada capa no tiene un actor o un motivo de cambio distinto, aplana.

## Abstracción especulativa

Abstraer por un cambio hipotético que nunca llega (`IPaymentGateway` "por si un día usamos PayPal" cuando sólo hay Stripe y nadie lo pidió).

Regla: espera evidencia del eje de cambio — una segunda implementación real o un requerimiento **anunciado** por escrito — antes de abstraer. El roadmap informal no cuenta.

## DI container como religión

Inyectar todo, incluso lo estable: `StringEncoder`, `ArrayMapper`, `ClockWrapper` alrededor de `Date`. Nest con 40 tokens para un CRUD de 3 tablas.

DI es una técnica. DIP es una dirección. Inyectar `PrismaService` en el dominio es DI sin DIP.

## SRP atomizado

Confundir SRP con "una función por clase" — el error que el cap. 7 advierte. `ValidateEmail`, `HashPassword`, `SaveUser`, `SendWelcomeMail` como tipos públicos cuando el único actor es "registro de cuenta" y siempre cambian juntos: déjalos como métodos o funciones del mismo módulo.

## Wrapping de la stdlib

```ts
export interface JsonParser { parse(s: string): unknown; }
export class JsonParserImpl { parse(s: string) { return JSON.parse(s); } }
```

`JSON`, `Date`, `Map`, `Promise`, `fetch` en runtimes estables no son volátiles. No los envuelvas salvo que el tiempo o el HTTP sean un eje de test **ya** doloroso (y entonces un `Clock` / `HttpClient` de 1 método, no un catálogo).

## Refactor de todo el legacy de golpe

Reescribir el monolito "para dejarlo SOLID" en un PR. Aplica el principio **en el límite que estás tocando**: al añadir el segundo canal de mail, introduce `MailView`; no partas las 80 clases del módulo de facturación "de paso".

## OCP con estrategias de un boolean

`interface DiscountPolicy { apply(n: number): number }` con una sola `NoOpDiscount` porque "el producto dijo que a lo mejor hay cupones". Un `if (coupon)` local es más honesto hasta el segundo algoritmo.

## ISP cosmético

Partir `User` en `UserName`, `UserEmail`, `UserId` sin clientes que dependan de un subconjunto. ISP es por **clientes distintos**, no por campos.

## LSP de fachada

Hacer que `NullPaymentGateway` "implemente" `charge` y no cobre en producción para un feature flag. El cliente cree que cobró. Un `Result` explícito o no llamar al gateway es más seguro que un subtipo que miente.
