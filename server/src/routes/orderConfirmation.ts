import { Hono } from "hono";
import { createHash } from "node:crypto";
import { db } from "../database/db";
import {
  expirePendingReservations,
  getOrderById,
} from "../data/store";
import { sendOrderConfirmationEmail } from "../services/emailService";

const orderConfirmation = new Hono();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

/**
 * POST /api/order-confirmation
 *
 * Confirms that the customer has submitted their order for payment review.
 * It does NOT mark payment as paid or verified.
 */
orderConfirmation.post("/", async (c) => {
  try {
    const body = await c.req.json<{
      orderId?: string;
      confirmationToken?: string;
    }>();

    const orderId = body.orderId?.trim();
    const confirmationToken = body.confirmationToken?.trim();

    if (!orderId || !confirmationToken) {
      return c.json(
        {
          success: false,
          error: "Order ID and confirmation token are required.",
        },
        400
      );
    }

    if (confirmationToken.length < 32 || confirmationToken.length > 256) {
      return c.json(
        {
          success: false,
          error: "The confirmation token is invalid.",
        },
        400
      );
    }

    // Release expired reservations before processing this confirmation.
    expirePendingReservations();

    const tokenHash = hashToken(confirmationToken);
    const now = new Date().toISOString();

    /*
     * The conditional update makes confirmation single-use.
     * Payment remains pending until an administrator verifies it.
     */
    const updateResult = db
      .prepare(`
        UPDATE orders
        SET
          order_status = 'payment_review_pending',
          confirmed_at = ?,
          updated_at = ?
        WHERE id = ?
          AND confirmation_token_hash = ?
          AND confirmed_at IS NULL
          AND reservation_released_at IS NULL
          AND order_status = 'payment_pending'
          AND reservation_expires_at IS NOT NULL
          AND reservation_expires_at > ?
      `)
      .run(now, now, orderId, tokenHash, now);

    let order = getOrderById(orderId);

    if (!order) {
      return c.json(
        {
          success: false,
          error: "This order could not be found.",
        },
        404
      );
    }

    /*
     * If the conditional update failed, allow a valid previously confirmed
     * order to retry an email that failed earlier.
     */
    if (updateResult.changes === 0) {
      const tokenCheck = db
        .prepare(`
          SELECT
            confirmation_token_hash,
            confirmed_at,
            reservation_expires_at,
            reservation_released_at,
            order_status
          FROM orders
          WHERE id = ?
        `)
        .get(orderId) as
        | {
            confirmation_token_hash: string | null;
            confirmed_at: string | null;
            reservation_expires_at: string | null;
            reservation_released_at: string | null;
            order_status: string;
          }
        | undefined;

      if (
        !tokenCheck?.confirmation_token_hash ||
        tokenCheck.confirmation_token_hash !== tokenHash
      ) {
        return c.json(
          {
            success: false,
            error: "The confirmation link is invalid.",
          },
          403
        );
      }

      if (tokenCheck.reservation_released_at || tokenCheck.order_status === "cancelled") {
        return c.json(
          {
            success: false,
            error: "This order reservation has expired. Please place a new order.",
          },
          410
        );
      }

      if (!tokenCheck.confirmed_at) {
        if (
          !tokenCheck.reservation_expires_at ||
          new Date(tokenCheck.reservation_expires_at).getTime() <= Date.now()
        ) {
          expirePendingReservations();

          return c.json(
            {
              success: false,
              error: "This order reservation has expired. Please place a new order.",
            },
            410
          );
        }

        return c.json(
          {
            success: false,
            error: "This order cannot be confirmed in its current state.",
          },
          409
        );
      }
    }

    // Reload the order after the status update.
    order = getOrderById(orderId);

    if (!order) {
      return c.json(
        {
          success: false,
          error: "The order could not be loaded.",
        },
        500
      );
    }

    /*
     * Recover email claims abandoned by a crashed process.
     * The 15-minute threshold avoids immediately taking over a slow send.
     */
    const staleClaimCutoff = new Date(
      Date.now() - 15 * 60 * 1000
    ).toISOString();

    db.prepare(`
      UPDATE orders
      SET email_claimed = 0, email_claimed_at = NULL
      WHERE id = ?
        AND email_sent = 0
        AND email_claimed = 1
        AND (
          email_claimed_at IS NULL
          OR email_claimed_at < ?
        )
    `).run(orderId, staleClaimCutoff);

    /*
     * Claim the email atomically. Only one request can claim an unsent email.
     * A failed delivery releases the claim so a later request can retry.
     */
    const emailClaim = db
      .prepare(`
        UPDATE orders
        SET email_claimed = 1, email_claimed_at = ?
        WHERE id = ?
          AND confirmed_at IS NOT NULL
          AND email_sent = 0
          AND email_claimed = 0
      `)
      .run(new Date().toISOString(), orderId);

    let emailSent = false;

    if (emailClaim.changes > 0) {
      try {
        await sendOrderConfirmationEmail({
          orderId: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          total: order.total,
          currency: order.currency,
          shippingAddress: [
            order.shipping_address,
            order.city,
            order.state,
            order.postal_code,
            order.country,
          ]
            .filter(Boolean)
            .join(", "),
          items: (order.items ?? []).map((item) => ({
            product_name: item.product_name,
            quantity: item.quantity,
            total: item.total,
          })),
        });

        db.prepare(`
          UPDATE orders
          SET email_sent = 1, email_claimed = 0, email_claimed_at = NULL, updated_at = ?
          WHERE id = ?
        `).run(new Date().toISOString(), orderId);

        emailSent = true;
      } catch (error) {
        console.error(
          `Order confirmation email failed for ${orderId}:`,
          getErrorMessage(error)
        );

        // Permit a later request to retry the email.
        db.prepare(`
          UPDATE orders
          SET email_claimed = 0, email_claimed_at = NULL
          WHERE id = ? AND email_sent = 0
        `).run(orderId);
      }
    } else {
      const emailState = db
        .prepare(`
          SELECT email_sent FROM orders WHERE id = ?
        `)
        .get(orderId) as { email_sent: number } | undefined;

      emailSent = emailState?.email_sent === 1;
    }

    const latestOrder = getOrderById(orderId);

    return c.json({
      success: true,
      message:
        "Your order has been submitted for payment review. Payment has not yet been verified.",
      data: {
        orderId,
         orderReference: latestOrder?.order_reference ?? orderId,
         orderStatus: latestOrder?.order_status ?? "payment_review_pending",
         paymentStatus: latestOrder?.payment_status ?? "pending",
        emailSent,
        emailMessage: emailSent
          ? "Order confirmation email sent."
          : "Your order is confirmed for review. The email is pending and can be retried.",
      },
    });
  } catch (error) {
    console.error("Order confirmation failed:", getErrorMessage(error));

    return c.json(
      {
        success: false,
        error: "We could not confirm this order right now. Please try again.",
      },
      500
    );
  }
});

export default orderConfirmation;