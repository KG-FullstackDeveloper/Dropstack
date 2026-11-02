import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";
import { workerAuthMiddleware } from "./auth";

type Workspace = "global" | "nigeria";
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

const aiService = new Hono<WorkerEnvironment>();
aiService.use("*", workerAuthMiddleware);

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "qwen/qwen3.8-27b";

async function loadTableRows<T = Record<string, unknown>>(
  db: WorkerEnvironment["Bindings"]["DB"],
  query: string,
): Promise<T[]> {
  const result = await db.prepare(query).all<T>();

  if (!result.success) {
    throw new Error(result.error || "Database query failed.");
  }

  return (result.results ?? []) as T[];
}

async function buildBusinessContext(
  db: WorkerEnvironment["Bindings"]["DB"],
  workspace: Workspace,
) {
  if (workspace === "nigeria") {
    const orders = await loadTableRows<any>(
      db,
      `SELECT * FROM nigeria_orders ORDER BY created_at DESC LIMIT 100`,
    );
    const products = await loadTableRows<any>(
      db,
      `SELECT p.*, COALESCE(i.quantity, p.inventory) AS inventory FROM nigeria_products p LEFT JOIN nigeria_inventory i ON i.product_id = p.id ORDER BY p.created_at DESC`,
    );
    const customers = await loadTableRows<any>(
      db,
      `SELECT * FROM nigeria_customers ORDER BY created_at DESC`,
    );
    const orderItems = await loadTableRows<any>(
      db,
      `SELECT oi.* FROM nigeria_order_items oi INNER JOIN nigeria_orders o ON o.id = oi.order_id WHERE o.payment_status = 'confirmed'`,
    );

    const paidOrders = orders.filter(
      (order) => order.payment_status === "confirmed",
    );
    const revenue = paidOrders.reduce(
      (sum: number, order: any) => sum + Number(order.total || 0),
      0,
    );
    const profit = paidOrders.reduce(
      (sum: number, order: any) => sum + Number(order.profit || 0),
      0,
    );
    const unitsSold = orderItems.reduce(
      (sum: number, item: any) => sum + Number(item.quantity || 0),
      0,
    );

    return {
      workspace: "Nigeria Ecommerce",
      workspaceKey: "nigeria",
      dataSource: "Nigeria Ecommerce database only",
      generatedAt: new Date().toISOString(),
      summary: {
        totalOrders: orders.length,
        confirmedOrders: paidOrders.length,
        totalProducts: products.length,
        activeProducts: products.filter((product) => product.active === 1)
          .length,
        uniqueCustomers: customers.length,
        revenue,
        profit,
        unitsSold,
        averageOrderValue: paidOrders.length ? revenue / paidOrders.length : 0,
        profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
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
        inventory: product.inventory,
        profitPerUnit: product.profit_per_unit,
        profitMargin: product.profit_margin,
        active: product.active === 1,
        supplier: product.supplier_name,
      })),
      orders: orders.map((order) => ({
        id: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        country: order.country,
        currency: order.currency,
        total: order.total,
        profit: order.profit,
        paymentStatus: order.payment_status,
        settlementStatus: order.settlement_status,
        orderStatus: order.order_status,
        createdAt: order.created_at,
      })),
    };
  }

  const orders = await loadTableRows<any>(
    db,
    `SELECT * FROM orders ORDER BY created_at DESC LIMIT 100`,
  );
  const products = await loadTableRows<any>(
    db,
    `SELECT * FROM products ORDER BY created_at DESC`,
  );
  const customers = await loadTableRows<any>(
    db,
    `SELECT * FROM customers ORDER BY created_at DESC`,
  );
  const orderItems = await loadTableRows<any>(
    db,
    `SELECT oi.* FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id WHERE o.payment_status = 'confirmed'`,
  );

  const paidOrders = orders.filter(
    (order) => order.payment_status === "confirmed",
  );
  const revenue = paidOrders.reduce(
    (sum: number, order: any) => sum + Number(order.total || 0),
    0,
  );
  const profit = orderItems.reduce(
    (sum: number, item: any) => sum + Number(item.profit || 0),
    0,
  );
  const unitsSold = orderItems.reduce(
    (sum: number, item: any) => sum + Number(item.quantity || 0),
    0,
  );

  return {
    workspace: "Global Ecommerce",
    workspaceKey: "global",
    dataSource: "Global Ecommerce database only",
    generatedAt: new Date().toISOString(),
    summary: {
      totalOrders: orders.length,
      confirmedOrders: paidOrders.length,
      totalProducts: products.length,
      activeProducts: products.filter((product) => product.active === 1).length,
      uniqueCustomers: customers.length,
      revenue,
      profit,
      unitsSold,
      averageOrderValue: paidOrders.length ? revenue / paidOrders.length : 0,
      profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
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
      inventory: product.inventory,
      profitPerUnit: product.profit_per_unit,
      profitMargin: product.profit_margin,
      active: product.active === 1,
      supplier: product.supplier_name,
    })),
    orders: orders.map((order) => ({
      id: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      country: order.country,
      currency: order.currency,
      total: order.total,
      profit: order.profit,
      paymentStatus: order.payment_status,
      settlementStatus: order.settlement_status,
      orderStatus: order.order_status,
      createdAt: order.created_at,
    })),
  };
}

function buildSystemPrompt(
  context: Awaited<ReturnType<typeof buildBusinessContext>>,
  currentPage: string,
) {
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

CURRENT PLATFORM/BUSINESS CONTEXT:
Current page: ${currentPage}
Current workspace: ${context.workspace}

The current workspace is the business boundary for business-data questions. Platform-wide questions can use MEO application knowledge, but business figures must come only from the current workspace dataset.

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
        typeof message === "object" && message !== null,
    )
    .map(
      (message): ChatMessage => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: String(message.content || "").trim(),
      }),
    )
    .filter((message) => message.content.length > 0)
    .slice(-30);
}

aiService.post("/", async (c) => {
  try {
    const apiKey = c.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
      return c.json(
        {
          success: false,
          error: "GROQ_API_KEY is not configured on the server.",
        },
        500,
      );
    }

    const body = await c.req.json<{
      messages?: unknown;
      workspace?: Workspace;
      currentPage?: string;
    }>();

    const workspace: Workspace =
      body.workspace === "nigeria" ? "nigeria" : "global";
    const currentPage = String(body.currentPage || "Overview");
    const history = cleanHistory(body.messages);

    if (history.length === 0) {
      return c.json({ success: false, error: "A message is required." }, 400);
    }

    const context = await buildBusinessContext(c.env.DB, workspace);
    const model = c.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(context, currentPage) },
          ...history,
        ],
        temperature: 0.7,
        max_completion_tokens: 900,
        reasoning_effort: "none",
        reasoning_format: "hidden",
      }),
    });

    const data = (await response.json()) as GroqResponse;

    if (!response.ok) {
      console.error("Groq AI error:", data);
      return c.json(
        {
          success: false,
          error: data.error?.message || "Groq AI request failed.",
        },
        response.status as 400 | 401 | 403 | 404 | 429 | 500 | 502 | 503,
      );
    }

    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return c.json(
        { success: false, error: "The AI returned an empty response." },
        502,
      );
    }

    return c.json({
      success: true,
      answer,
      model,
      workspace,
    });
  } catch (error) {
    console.error("Worker AI route error:", error);

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

export default aiService;
