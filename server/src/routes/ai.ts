import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

import {
  getAllOrders,
  getAllProducts,
} from "../data/store";

type ChatRole = "system" | "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

const ai = new Hono();
ai.use("*", authMiddleware);

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "qwen/qwen3.8-27b";

function buildBusinessContext() {
  const orders = getAllOrders();
  const products = getAllProducts();

  const paidOrders = orders.filter(
    (order) => order.payment_status === "confirmed",
  );

  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0,
  );

  const profit = paidOrders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemSum, item) => itemSum + Number(item.profit || 0),
        0,
      ),
    0,
  );

  const unitsSold = paidOrders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemSum, item) => itemSum + Number(item.quantity || 0),
        0,
      ),
    0,
  );

  const customers = new Set(
    paidOrders
      .map((order) => order.customer_email?.trim().toLowerCase())
      .filter(Boolean),
  );

  const productPerformance = new Map<
    string,
    {
      name: string;
      units: number;
      revenue: number;
      profit: number;
    }
  >();

  for (const order of paidOrders) {
    for (const item of order.items) {
      const existing = productPerformance.get(item.product_id);

      if (existing) {
        existing.units += Number(item.quantity || 0);
        existing.revenue += Number(item.total || 0);
        existing.profit += Number(item.profit || 0);
      } else {
        productPerformance.set(item.product_id, {
          name: item.product_name,
          units: Number(item.quantity || 0),
          revenue: Number(item.total || 0),
          profit: Number(item.profit || 0),
        });
      }
    }
  }

  return {
    workspace: "Global Ecommerce",
    dataSource: "Global Ecommerce database only",
    generatedAt: new Date().toISOString(),

    summary: {
      totalOrders: orders.length,
      confirmedOrders: paidOrders.length,
      totalProducts: products.length,
      activeProducts: products.filter(
        (product) => product.active === 1,
      ).length,
      uniqueCustomers: customers.size,
      revenue,
      profit,
      unitsSold,
      averageOrderValue:
        paidOrders.length > 0
          ? revenue / paidOrders.length
          : 0,
      profitMargin:
        revenue > 0
          ? (profit / revenue) * 100
          : 0,
    },

    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      currency: product.currency,
      supplierCost: product.supplier_cost,
      shippingCost: product.shipping_cost,
      otherCost: product.other_cost,
      profitPerUnit: product.profit_per_unit,
      profitMargin: product.profit_margin,
      active: product.active === 1,
      supplier: product.supplier_name,
      warehouseCountry: product.warehouse_country,
      processingTime: product.processing_time,
      deliveryTime: product.delivery_time,
    })),

    productPerformance: Array.from(
      productPerformance.values(),
    ),

    orders: orders.slice(0, 100).map((order) => ({
      id: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      country: order.country,
      currency: order.currency,
      total: order.total,
      paymentStatus: order.payment_status,
      settlementStatus: order.settlement_status,
      orderStatus: order.order_status,
      createdAt: order.created_at,
      items: order.items.map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        sellingPrice: item.selling_price,
        total: item.total,
        profit: item.profit,
      })),
    })),
  };
}

function buildSystemPrompt(context: ReturnType<typeof buildBusinessContext>) {
  return `
You are MEO Assistant, the intelligent AI assistant built into the MEO ecommerce platform.

You are available throughout the entire MEO web application, not just one dashboard or one page.

Your job is to help the store owner understand, operate, analyze, and improve their ecommerce business.

You can help with:
- orders
- products
- customers
- revenue
- profit
- profitability
- inventory
- analytics
- marketing
- promotions
- pricing
- suppliers
- fulfillment
- shipping
- store operations
- ecommerce strategy
- platform features
- settings
- reports
- business calculations
- troubleshooting
- planning
- understanding how MEO works

You are a conversational business assistant, not a questionnaire or report generator.

CONVERSATION BEHAVIOR:

- Answer the user's actual question directly.
- Maintain context from previous messages.
- Understand natural follow-up questions.
- If the user says "why?", determine what they are referring to from the conversation.
- If the user says "what about that product?", use the previous conversation to identify the product.
- If the user asks for a calculation, calculate it using the supplied data.
- If the user asks for a comparison, compare the relevant supplied information.
- If the user asks for an explanation, explain it clearly.
- If the user asks for advice, provide practical reasoning based on the available information.
- Do not force the user through predetermined questions.
- Do not repeatedly ask generic follow-up questions.
- Ask a question only when missing information is genuinely required.
- Keep responses concise enough for a business dashboard while still giving the necessary explanation.
- Use bullets or tables only when they genuinely improve clarity.
- Do not repeat information unnecessarily.

DATA RULES:

- Only use data explicitly supplied to you in the current request and conversation.
- Never invent orders, products, customers, revenue, costs, inventory, traffic, conversion rates, suppliers, or business results.
- Never pretend that missing historical data exists.
- Clearly distinguish:
  1. Recorded data
  2. Calculations derived from recorded data
  3. Recommendations or suggestions
- When calculating something, show the calculation when useful.
- If there is insufficient data, clearly state what is missing.
- Never claim that an action was performed unless an actual tool/action exists and was executed.

WORKSPACE ISOLATION:

MEO has separate workspaces and business datasets.

If the request supplies workspace information, obey that workspace boundary.

Never mix Global Ecommerce data with Nigeria Ecommerce data.

Never use Nigeria Ecommerce information when answering a Global Ecommerce question.

Never use Global Ecommerce information when answering a Nigeria Ecommerce question.

If no workspace-specific business data is supplied, do not invent or assume business data from another workspace.

PLATFORM-WIDE QUESTIONS:

The user may ask about MEO itself rather than their business data.

For questions about MEO features, pages, workflows, settings, dashboards, AI functionality, or how the platform works, answer using the platform information supplied in the request.

Do not incorrectly restrict these questions to a single workspace.

BUSINESS QUESTIONS:

When actual business data is supplied, use it.

For example:
- "How much profit did I make?"
- "Which product generated the most profit?"
- "Why did revenue fall?"
- "Calculate my margin."
- "Compare these products."
- "How many confirmed orders do I have?"
- "What should I improve?"
- "What does this analytics number mean?"

Answer using the supplied data and clearly identify whether the answer is a recorded fact, calculation, or recommendation.

RECOMMENDATIONS:

Recommendations should be practical and based on the information available.

Do not present guesses as facts.

If several approaches are possible, explain the relevant tradeoffs rather than pretending there is only one correct answer.

ACTIONS:

You may explain how the user can perform an action in MEO.

Do not claim that you changed settings, created products, edited orders, sent messages, or performed any other action unless an actual backend tool exists and the action was successfully executed.

NAVIGATION LINKS:

When a user would benefit from opening a MEO page, include a clickable navigation action using exactly this format:
[Open Products](meo://Products)

Supported navigation targets are:
- [Open Overview](meo://Overview)
- [Open Stores](meo://Stores)
- [Open Orders](meo://Orders)
- [Open Fulfillment](meo://Fulfillment)
- [Open Products](meo://Products)
- [Open Customers](meo://Customers)
- [Open Inventory](meo://Inventory)
- [Open Analytics](meo://Analytics)
- [Open Payments](meo://Payments)
- [Open Shipping](meo://Shipping)
- [Open Storefront](meo://Storefront)
- [Open Theme Editor](meo://Theme Editor)
- [Open Settings](meo://Settings)

Use these links naturally when they help. Do not invent navigation targets.

CURRENT PLATFORM/BUSINESS CONTEXT:

[INSERT THE CURRENT MEO PLATFORM CONTEXT AND ANY WORKSPACE-SCOPED DATA HERE]

${JSON.stringify(context, null, 2)}
`;
}

function cleanHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (message): message is Record<string, unknown> =>
        typeof message === "object" &&
        message !== null,
    )
    .map((message): ChatMessage => ({
      role:
        message.role === "assistant"
          ? "assistant"
          : "user",
      content: String(
        message.content || "",
      ).trim(),
    }))
    .filter(
      (message) => message.content.length > 0,
    )
    .slice(-30);
}

ai.post("/", async (c) => {
  try {
    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
      return c.json(
        {
          success: false,
          error:
            "GROQ_API_KEY is not configured on the server.",
        },
        500,
      );
    }

    const body = await c.req.json<{
      messages?: unknown;
    }>();

    const history = cleanHistory(body.messages);

    if (history.length === 0) {
      return c.json(
        {
          success: false,
          error: "A message is required.",
        },
        400,
      );
    }

    const context = buildBusinessContext();

    const model =
      process.env.GROQ_MODEL?.trim() ||
      DEFAULT_MODEL;

    const groqMessages = [
      {
        role: "system" as const,
        content: buildSystemPrompt(context),
      },
      ...history,
    ];

    const response = await fetch(
      GROQ_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: groqMessages,
          temperature: 0.7,
          max_completion_tokens: 900,
          reasoning_effort: "none",
          reasoning_format: "hidden",
        }),
      },
    );

    const data =
      (await response.json()) as GroqResponse;

    if (!response.ok) {
      console.error(
        "Groq AI error:",
        data,
      );

      return c.json(
        {
          success: false,
          error:
            data.error?.message ||
            "Groq AI request failed.",
        },
        response.status as 400 | 401 | 403 | 404 | 429 | 500 | 502 | 503,
      );
    }

    const answer =
      data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return c.json(
        {
          success: false,
          error: "The AI returned an empty response.",
        },
        502,
      );
    }

    return c.json({
      success: true,
      answer,
      model,
      workspace: "global",
    });
  } catch (error) {
    console.error("AI route error:", error);

    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to contact the AI service.",
      },
      500,
    );
  }
});

export default ai;
