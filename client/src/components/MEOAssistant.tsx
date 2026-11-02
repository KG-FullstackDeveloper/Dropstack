import {
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  Copy,
  Edit3,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Link } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_URL || window.location.origin)
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");
const AI_ENDPOINT = `${API_BASE}/api/ai`;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ApiResponse {
  success?: boolean;
  answer?: string;
  error?: string;
}

type AssistantWorkspace = "global" | "nigeria";

interface MEOAssistantProps {
  workspace?: AssistantWorkspace;
  currentPage?: string;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
      <button
        key={`${index}-${match[2]}`}
        type="button"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("meo:navigate", { detail: { page: match[2] } }),
          )
        }
        className="my-2 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 transition hover:border-slate-400 hover:bg-white"
      >
        {match[1]}
      </button>
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
              className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-lg shadow-slate-950/40"
            >
              <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                <span>Code</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(block.trim())}
                  className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                >
                  Copy
                </button>
              </div>
              <pre className="overflow-x-auto p-3 text-[12px] leading-6 text-slate-100">
                <code>{block.trim()}</code>
              </pre>
            </div>
          );
        }

        return (
          <div key={`text-${index}`} className="space-y-3">
            {renderRichText(block)}
          </div>
        );
      })}
    </div>
  );
}

const starterPrompts = [
  "Check my business growth",
  "What is currently hurting my profit?",
  "What should I add to the platform?",
  "Analyze my products",
];

export default function MEOAssistant({
  workspace = "global",
  currentPage = "Overview",
}: MEOAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const openAssistant = (event?: Event) => {
      const detail = (
        event as CustomEvent<{ workspace?: AssistantWorkspace }> | undefined
      )?.detail;
      if (detail?.workspace && detail.workspace !== workspace) return;
      setOpen(true);
      window.setTimeout(() => textareaRef.current?.focus(), 100);
    };

    window.addEventListener("meo:open-assistant", openAssistant);

    const commandHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        command?: string;
        workspace?: string;
      }>;

      if (
        customEvent.detail?.command === "open-assistant" &&
        (!customEvent.detail?.workspace ||
          customEvent.detail.workspace === workspace)
      ) {
        setOpen(true);
        window.setTimeout(() => textareaRef.current?.focus(), 100);
      }
    };

    window.addEventListener("meo:command", commandHandler);

    return () => {
      window.removeEventListener("meo:open-assistant", openAssistant);
      window.removeEventListener("meo:command", commandHandler);
    };
  }, [workspace]);

  const sendMessage = async (forcedMessage?: string) => {
    const text = (forcedMessage ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setEditingId(null);
    setError(null);

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: text,
    };
    const previousMessages = messages;

    setMessages((current) => [...current, userMessage]);
    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          workspace,
          currentPage,
          messages: [
            ...previousMessages.map((item) => ({
              role: item.role,
              content: item.content,
            })),
            { role: "user", content: text },
          ],
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "The AI service could not process the request.",
        );
      }

      const assistantText = result.answer?.trim();
      if (!assistantText) {
        throw new Error("The AI returned an empty response.");
      }

      setMessages((current) => [
        ...current,
        { id: createId(), role: "assistant", content: assistantText },
      ]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while contacting MEO Assistant.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: `I couldn't complete that request. ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const editMessage = (message: ChatMessage) => {
    if (message.role !== "user") return;

    const index = messages.findIndex((item) => item.id === message.id);
    if (index === -1) return;

    setInput(message.content);
    setEditingId(message.id);
    setMessages(messages.slice(0, index));
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const copyMessage = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard access may be unavailable.
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setInput("");
    setEditingId(null);
    setError(null);
  };

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 z-[120] flex w-full justify-end">
      <div className="pointer-events-auto flex h-full w-full max-w-[460px] flex-col border-l border-slate-700 bg-[#070b12] text-slate-100 shadow-[0_0_60px_rgba(15,23,42,0.8)]">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-sky-500 to-cyan-400 shadow-lg shadow-sky-500/20">
              <div className="absolute inset-0 animate-ping rounded-2xl bg-sky-400/30" />
              <Bot size={19} className="relative" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">MEO Assistant</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                {workspace === "nigeria"
                  ? "Nigeria Ecommerce"
                  : "Global Ecommerce"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              to={workspace === "nigeria" ? "/nigeria-admin" : "/admin/ai"}
              onClick={() => setOpen(false)}
              className="rounded-xl px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Full page
            </Link>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearConversation}
                className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                title="New conversation"
              >
                <MessageSquare size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="Close MEO Assistant"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-5">
            {messages.length === 0 ? (
              <div className="flex min-h-full flex-col justify-center">
                <div className="mx-auto max-w-sm text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/30 bg-slate-900">
                    <Sparkles size={24} className="text-sky-300" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">
                    How can I help?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Ask about business performance, margins, sales, stock, and
                    product opportunities.
                  </p>

                  <div className="mt-6 grid gap-2 text-left">
                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:border-sky-400/40 hover:bg-slate-800"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    <div
                      className={
                        message.role === "user" ? "max-w-[88%]" : "max-w-[90%]"
                      }
                    >
                      <div
                        className={
                          message.role === "user"
                            ? "rounded-[26px] rounded-br-md border border-sky-400/20 bg-gradient-to-br from-sky-500 to-indigo-500 px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-indigo-900/20"
                            : "rounded-[26px] rounded-bl-md border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm leading-6 text-slate-100 shadow-lg shadow-slate-950/40"
                        }
                      >
                        {message.content.split("\n").map((line, index) => (
                          <p
                            key={`${message.id}-${index}`}
                            className={index > 0 ? "mt-2" : ""}
                          >
                            {line ? renderAssistantContent(line) : "\u00a0"}
                          </p>
                        ))}
                      </div>

                      <div
                        className={
                          message.role === "user"
                            ? "mt-2 flex justify-end gap-1"
                            : "mt-2 flex justify-start gap-1"
                        }
                      >
                        {message.role === "user" && (
                          <button
                            type="button"
                            onClick={() => editMessage(message)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            title="Edit question"
                          >
                            <Edit3 size={13} />
                          </button>
                        )}

                        {message.role === "assistant" && (
                          <button
                            type="button"
                            onClick={() => void copyMessage(message)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            title="Copy response"
                          >
                            {copiedId === message.id ? (
                              <Check size={13} />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-3 rounded-[26px] border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100">
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-sky-500 to-cyan-400 shadow-lg shadow-sky-500/20">
                      <div className="absolute inset-0 animate-ping rounded-2xl bg-sky-400/30" />
                      <BrainCircuit size={15} className="relative text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        AI status
                      </p>
                      <p className="font-medium text-slate-100">Thinking...</p>
                    </div>
                  </div>
                )}

                {error && !loading && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 p-3">
            {editingId && (
              <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Edit3 size={13} /> Editing your question
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setInput("");
                  }}
                  className="rounded-lg p-1 hover:bg-slate-800"
                >
                  {" "}
                  <X size={13} />{" "}
                </button>
              </div>
            )}

            <form onSubmit={submit} className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                rows={3}
                placeholder="Message MEO Assistant..."
                className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400/40"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-900/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between px-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Enter to send · Shift + Enter
              </p>
              <ChevronDown size={13} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
