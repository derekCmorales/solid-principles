/**
 * Fixture para eval 1: God object de checkout.
 * No es código de producción; el agente debe auditarlo.
 */
import { PrismaClient, type Order, type User } from "@prisma/client";
import Stripe from "stripe";
import { Resend } from "resend";
import { jsPDF } from "jspdf";
import type { FastifyReply, FastifyRequest } from "fastify";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
const resend = new Resend(process.env.RESEND_API_KEY);

type CheckoutBody = {
  userId: string;
  items: Array<{ sku: string; qty: number; unitCents: number }>;
  country: "US" | "MX" | "ES";
  coupon?: string;
  paymentMethodId: string;
};

export class OrderService {
  async handleCheckout(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = req.body as CheckoutBody;
    const user = await this.loadUser(body.userId);
    this.validateItems(body.items);
    this.validateUserCanBuy(user);
    const subtotal = this.subtotal(body.items);
    const discounted = this.applyCoupon(subtotal, body.coupon);
    const tax = this.computeTax(discounted, body.country);
    const total = discounted + tax;
    const charge = await this.chargeStripe(user, body.paymentMethodId, total);
    const order = await this.persistOrder(user, body, total, tax, charge.id);
    await this.sendPaidEmail(user, order);
    const pdf = this.buildInvoicePdf(user, order);
    await this.storeInvoice(order.id, pdf);
    await this.notifySlackPaid(order);
    await this.writeAudit(user.id, "checkout");
    reply.send({ orderId: order.id, total });
  }

  private async loadUser(id: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("USER_NOT_FOUND");
    if (user.banned) throw new Error("USER_BANNED");
    return user;
  }

  private validateItems(items: CheckoutBody["items"]): void {
    if (items.length === 0) throw new Error("EMPTY_CART");
    for (const item of items) {
      if (item.qty < 1) throw new Error("BAD_QTY");
      if (item.unitCents < 0) throw new Error("BAD_PRICE");
    }
  }

  private validateUserCanBuy(user: User): void {
    if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");
  }

  private subtotal(items: CheckoutBody["items"]): number {
    return items.reduce((acc, item) => acc + item.qty * item.unitCents, 0);
  }

  private applyCoupon(subtotal: number, coupon?: string): number {
    if (!coupon) return subtotal;
    if (coupon === "WELCOME10") return Math.floor(subtotal * 0.9);
    if (coupon === "VIP25") return Math.floor(subtotal * 0.75);
    return subtotal;
  }

  private computeTax(net: number, country: CheckoutBody["country"]): number {
    const rates: Record<CheckoutBody["country"], number> = {
      US: 0.07,
      MX: 0.16,
      ES: 0.21,
    };
    return Math.floor(net * rates[country]);
  }

  private async chargeStripe(
    user: User,
    paymentMethodId: string,
    amount: number,
  ): Promise<{ id: string }> {
    const customer = await stripe.customers.create({
      email: user.email,
    });
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: customer.id,
      payment_method: paymentMethodId,
      confirm: true,
    });
    if (intent.status !== "succeeded") {
      throw new Error("PAYMENT_FAILED");
    }
    return { id: intent.id };
  }

  private async persistOrder(
    user: User,
    body: CheckoutBody,
    total: number,
    tax: number,
    chargeId: string,
  ): Promise<Order> {
    return prisma.order.create({
      data: {
        userId: user.id,
        totalCents: total,
        taxCents: tax,
        stripeChargeId: chargeId,
        country: body.country,
        items: {
          create: body.items.map((item) => ({
            sku: item.sku,
            qty: item.qty,
            unitCents: item.unitCents,
          })),
        },
      },
    });
  }

  private async sendPaidEmail(user: User, order: Order): Promise<void> {
    await resend.emails.send({
      from: "orders@example.com",
      to: user.email,
      subject: `Order ${order.id} paid`,
      html: `<p>Thanks. Total ${(order as Order & { totalCents: number }).totalCents}</p>`,
    });
  }

  private buildInvoicePdf(user: User, order: Order): Buffer {
    const doc = new jsPDF();
    doc.text(`Invoice ${order.id}`, 10, 10);
    doc.text(user.email, 10, 20);
    return Buffer.from(doc.output("arraybuffer"));
  }

  private async storeInvoice(orderId: string, pdf: Buffer): Promise<void> {
    await prisma.invoice.upsert({
      where: { orderId },
      create: { orderId, pdf },
      update: { pdf },
    });
  }

  async refund(orderId: string, reason: string): Promise<void> {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    await stripe.refunds.create({
      payment_intent: (order as Order & { stripeChargeId: string }).stripeChargeId,
    });
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "refunded" },
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: order.userId },
    });
    await resend.emails.send({
      from: "orders@example.com",
      to: user.email,
      subject: `Refund ${orderId}`,
      html: `<p>${reason}</p>`,
    });
  }

  async dailySalesCsv(): Promise<string> {
    const rows = await prisma.order.findMany({
      where: { createdAt: { gte: startOfUtcDay(new Date()) } },
    });
    const header = "id,totalCents";
    const body = rows
      .map((row) => `${row.id},${(row as Order & { totalCents: number }).totalCents}`)
      .join("\n");
    return `${header}\n${body}`;
  }

  async notifySlackPaid(order: Order): Promise<void> {
    await fetch(process.env.SLACK_WEBHOOK_URL ?? "", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: `order ${order.id} paid` }),
    });
  }

  async writeAudit(userId: string, action: string): Promise<void> {
    await prisma.auditLog.create({
      data: { userId, action, at: new Date() },
    });
  }
}

function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
