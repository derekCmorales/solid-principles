# Checklist SOLID (code review)

Imprime o pega en el PR. Marca evidencia (ruta:línea), no impresiones.

## Antes

- [ ] Actores / ejes de cambio de **este** PR identificados (quién pidió el cambio).
- [ ] No se audita un archivo quieto "por higiene".

## SRP

- [ ] El módulo tocado tiene un actor, o el PR es el que lo parte.
- [ ] No se extrae una clase por cada función nueva.
- [ ] Un helper compartido no mezcla reglas de dos actores.

## OCP

- [ ] Una variante nueva no reabre el interactor (el `switch` de creación está en el root).
- [ ] No se abrió un puerto por una implementación hipotética.

## LSP

- [ ] Sin `instanceof` / `switch` de tipo en dominio.
- [ ] Ningún `throw new Error("not supported")` en un método de interfaz.
- [ ] Adapters de terceros cumplen el mismo contrato hacia adentro.

## ISP

- [ ] El cliente no importa un módulo/barrel por un símbolo.
- [ ] No hay métodos vacíos para satisfacer un tipo gordo.

## DIP

- [ ] El caso de uso no importa Prisma, Stripe, Fastify, Next, Resend.
- [ ] Los concretos volátiles se nombran en el composition root.
- [ ] No hay wrapper de stdlib (`JSON`, `Date`, `Map`).

## Sobre-diseño

- [ ] Cada interface nueva tiene segunda implementación real o requerimiento escrito.
- [ ] No hay cadena de delegación anémica.
- [ ] El PR no "SOLID-ifica" código que no toca.

## Costo declarado

- [ ] Archivos/indirección añadidos vs. dolor que cierran.
- [ ] Si no hay hallazgo, el review lo dice.
