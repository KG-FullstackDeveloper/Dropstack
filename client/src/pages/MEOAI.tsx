import {
  ArrowUp,
  BrainCircuit,
  Check,
  Copy,
  Plus,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || window.location.origin)
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");
const AI_ENDPOINT = `${API_BASE}/api/ai`;

type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

const STORAGE_KEY = "meo_global_ai_conversation_v1";
const STARTERS = [
  "How is my business doing right now?",
  "What products are performing best?",
  "Check my profitability.",
  "What should I add to my ecommerce platform?",
];
const LOADING_STEPS = [
  "Thinking...",
  "Reviewing your store signals...",
  "Preparing a polished answer...",
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadMessages(): Message[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is Message =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    );
  } catch {
    return [];
  }
}

function renderRichText(text: string) {
  const tokens = text.split(/(\[[^\]]+\]\(meo:\/\/[^)]+\))/g);

  return tokens.map((token, index) => {
    const match = token.match(/^\[([^\]]+)\]\(meo:\/\/([^)]*)\)$/);

    if (!match) {
      return (
        <span
          key={`${index}-${token.slice(0, 12)}`}
          className="whitespace-pre-wrap"
        >
          {token}
        </span>
      );
    }

    return (
      <a
        key={`${match[2]}-${index}`}
        href={match[2]}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 transition hover:border-slate-400 hover:bg-white"
      >
        {match[1]}
      </a>
    );
  });
}

function renderAssistantContent(content: string) {
  const blocks = content.split(/```([\s\S]*?)```/g);

  if (blocks.length <= 1) {
    return <div className="space-y-3">{renderRichText(content)}</div>;
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          return (
            <div
              key={`code-${index}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-slate-100 shadow-lg shadow-slate-900/20"
            >
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                <span>Code</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(block.trim())}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                >
                  <Copy size={11} />
                  Copy
                </button>
              </div>
              <pre className="overflow-x-auto p-3 text-[12px] leading-6 text-slate-100">
                <code>{block.trim()}</code>
              </pre>
            </div>
          );
        }

        if (!block.trim()) return null;

        return (
          <div key={`text-${index}`} className="space-y-3">
            {renderRichText(block)}
          </div>
        );
      })}
    </div>
  );
}

export default function MEOAI() {
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      setThinkingIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setThinkingIndex((previous) => (previous + 1) % LOADING_STEPS.length);
    }, 900);

    return () => window.clearInterval(timer);
  }, [loading]);

  function focusComposer() {
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function newConversation() {
    setMessages([]);
    setInput("");
    setEditingId(null);
    setError(null);
    focusComposer();
  }

  async function sendMessage(explicitText?: string, replaceMessageId?: string) {
    const text = explicitText?.trim() || input.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = replaceMessageId
      ? messages.map((message) =>
          message.id === replaceMessageId
            ? { ...message, content: text }
            : message,
        )
      : [...messages, { id: makeId(), role: "user", content: text }];

    setMessages(nextMessages);
    setInput("");
    setEditingId(null);
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to get an AI response right now.",
        );
      }

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: String(data.answer || ""),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "The AI request failed.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: `I couldn't complete that request. ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
      focusComposer();
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function copyMessage(message: Message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard unavailable.
    }
  }

  function editMessage(message: Message) {
    setEditingId(message.id);
    setInput(message.content);
    focusComposer();
  }

  function regenerate(message: Message) {
    const index = messages.findIndex((item) => item.id === message.id);
    if (index < 1) return;

    const previousUserMessage = messages
      .slice(0, index)
      .reverse()
      .find((item) => item.role === "user");

    if (!previousUserMessage) return;

    const historyBeforeUser = messages.slice(
      0,
      messages.findIndex((item) => item.id === previousUserMessage.id),
    );

    setMessages(historyBeforeUser);
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const response = await fetch(AI_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: [
              ...historyBeforeUser.map((item) => ({
                role: item.role,
                content: item.content,
              })),
              { role: "user", content: previousUserMessage.content },
            ],
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to regenerate this response.");
        }

        setMessages([
          ...historyBeforeUser,
          previousUserMessage,
          {
            id: makeId(),
            role: "assistant",
            content: String(data.answer || ""),
          },
        ]);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to regenerate this response.";
        setError(message);
        setMessages([
          ...historyBeforeUser,
          previousUserMessage,
          {
            id: makeId(),
            role: "assistant",
            content: `I couldn't regenerate that response. ${message}`,
          },
        ]);
      } finally {
        setLoading(false);
        focusComposer();
      }
    })();
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-3 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-20 mb-4 rounded-[26px] border border-white/10 bg-slate-950/80 px-4 py-3 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-sky-500 to-cyan-400 shadow-lg shadow-sky-500/30">
                <div className="absolute inset-0 animate-ping rounded-2xl bg-sky-400/30" />
                <BrainCircuit size={20} className="relative text-white" />
              </div>
              <div>
                <p className="text-sm font-black tracking-[0.18em] text-white">
                  MEO AI
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Global Ecommerce
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={newConversation}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-400/40 hover:bg-slate-800"
            >
              <Plus size={14} />
              New chat
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          {!hasMessages ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-[30px] border border-sky-400/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-[0_20px_80px_rgba(56,189,248,0.16)]">
                <Sparkles size={30} className="text-sky-300" />
              </div>

              <h1 className="mt-8 text-center text-3xl font-black tracking-tight text-white sm:text-5xl">
                Business intelligence, without the noise.
              </h1>

              <p className="mt-4 max-w-2xl text-center text-sm leading-7 text-slate-300 sm:text-base">
                Ask about growth, margins, orders, inventory, and product
                opportunities using your live business context.
              </p>

              <div className="mt-8 grid w-full max-w-4xl gap-3 sm:grid-cols-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => void sendMessage(starter)}
                    className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-left text-sm font-semibold text-slate-100 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-slate-800/80"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 px-1 py-4 sm:px-2">
              <div className="mx-auto max-w-4xl space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    {message.role === "assistant" && (
                      <div className="mt-1 mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-gradient-to-br from-slate-900 to-slate-800 text-violet-200">
                        <Sparkles size={15} />
                      </div>
                    )}

                    <div
                      className={
                        message.role === "user" ? "max-w-[82%]" : "max-w-[84%]"
                      }
                    >
                      <div
                        className={
                          message.role === "user"
                            ? "rounded-[26px] rounded-br-md border border-sky-400/20 bg-gradient-to-br from-sky-500 to-indigo-500 px-4 py-3 text-sm leading-7 text-white shadow-lg shadow-indigo-900/20"
                            : "rounded-[26px] rounded-bl-md border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm leading-7 text-slate-100 shadow-xl shadow-slate-950/40"
                        }
                      >
                        {message.role === "assistant"
                          ? renderAssistantContent(message.content)
                          : message.content}
                      </div>

                      <div
                        className={
                          message.role === "user"
                            ? "mt-2 flex justify-end gap-2"
                            : "mt-2 flex justify-start gap-2"
                        }
                      >
                        {message.role === "user" && (
                          <button
                            type="button"
                            onClick={() => editMessage(message)}
                            className="rounded-xl px-2 py-1 text-[11px] font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                          >
                            Edit
                          </button>
                        )}

                        {message.role === "assistant" && (
                          <button
                            type="button"
                            onClick={() => void copyMessage(message)}
                            className="rounded-xl px-2 py-1 text-[11px] font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                          >
                            {copiedId === message.id ? (
                              <Check size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        )}

                        {message.role === "assistant" && (
                          <button
                            type="button"
                            onClick={() => regenerate(message)}
                            disabled={loading}
                            className="rounded-xl px-2 py-1 text-[11px] font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40"
                          >
                            <span className="inline-flex items-center gap-1">
                              <RefreshCw size={11} /> Regenerate
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="ml-3 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-200">
                        <UserRound size={15} />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-3 rounded-[26px] border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-xl shadow-slate-950/40">
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-sky-500 to-cyan-400 shadow-lg shadow-sky-500/30">
                      <div className="absolute inset-0 animate-ping rounded-2xl bg-sky-400/30" />
                      <Sparkles size={15} className="relative text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                        AI status
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                        <p className="text-sm font-medium text-slate-100">
                          {LOADING_STEPS[thinkingIndex]}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && !loading && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    {error}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>
          )}

          <div className="sticky bottom-0 border-t border-white/10 bg-[#070b12]/85 px-3 pb-4 pt-4 backdrop-blur-xl sm:px-6">
            <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
              {editingId && (
                <div className="mb-2 flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
                  <span>Editing your message</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setInput("");
                    }}
                    className="rounded-lg px-2 py-1 text-slate-200 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="rounded-[30px] border border-slate-700 bg-slate-900/80 p-2 shadow-[0_20px_80px_rgba(15,23,42,0.8)]">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Message MEO AI..."
                  className="max-h-40 min-h-[52px] w-full resize-none bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />

                <div className="mt-1 flex items-center justify-between px-2 pb-1">
                  <p className="hidden text-[11px] uppercase tracking-[0.18em] text-slate-500 sm:block">
                    Enter to send · Shift + Enter for newline
                  </p>

                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="ml-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
