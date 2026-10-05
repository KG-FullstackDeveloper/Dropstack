import {
  Bot,
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

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  FormEvent,
  KeyboardEvent,
} from "react";
import { Link } from "react-router-dom";

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

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}


function renderAssistantContent(content: string) {
  const parts = content.split(/(\[.*?\]\(meo:\/\/.*?\))/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[(.*?)\]\(meo:\/\/(.*?)\)$/);
    if (!match) return <span key={`${index}-${part.slice(0, 12)}`}>{part}</span>;
    const label = match[1];
    const target = match[2];
    return (
      <button
        key={`${index}-${target}`}
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("meo:navigate", { detail: { page: target } }))}
        className="my-2 inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 transition hover:border-slate-400 hover:bg-white"
      >
        {label} →
      </button>
    );
  });
}

const starterPrompts = [
  "Check my business growth",
  "What is currently hurting my profit?",
  "What should I add to the platform?",
  "Analyze my products",
];

export default function MEOAssistant() {
  const [open, setOpen] =
    useState(false);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [copiedId, setCopiedId] =
    useState<string | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      },
    );
  }, [messages, loading]);

  useEffect(() => {
    const openAssistant = () => {
      setOpen(true);

      window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    };

    window.addEventListener(
      "meo:open-assistant",
      openAssistant,
    );

    const commandHandler = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<{
          command?: string;
          workspace?: string;
        }>;

      if (
        customEvent.detail?.command ===
          "open-assistant" &&
        customEvent.detail?.workspace ===
          "global"
      ) {
        setOpen(true);

        window.setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    };

    window.addEventListener(
      "meo:command",
      commandHandler,
    );

    return () => {
      window.removeEventListener(
        "meo:open-assistant",
        openAssistant,
      );

      window.removeEventListener(
        "meo:command",
        commandHandler,
      );
    };
  }, []);

  const sendMessage = async (
    forcedMessage?: string,
  ) => {
    const text =
      (
        forcedMessage ??
        input
      ).trim();

    if (!text || loading) {
      return;
    }

    setInput("");
    setEditingId(null);

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: text,
    };

    const previousMessages =
      messages;

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response =
        await fetch(
          "http://localhost:4000/api/ai",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify({
              messages: [
                ...previousMessages.map((item) => ({
                  role: item.role,
                  content: item.content,
                })),
                { role: "user", content: text },
              ],
            }),
          },
        );

      const result =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "The AI service could not process the request.",
        );
      }

      const assistantText = result.answer?.trim();

      if (!assistantText) {
        throw new Error(
          "The AI returned an empty response.",
        );
      }

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: assistantText,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong while contacting MEO Assistant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submit = (
    event: FormEvent,
  ) => {
    event.preventDefault();

    void sendMessage();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void sendMessage();
    }
  };

  const editMessage = (
    message: ChatMessage,
  ) => {
    if (message.role !== "user") {
      return;
    }

    const index =
      messages.findIndex(
        (item) =>
          item.id === message.id,
      );

    if (index === -1) {
      return;
    }

    setInput(message.content);
    setEditingId(message.id);

    setMessages(
      messages.slice(0, index),
    );

    window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const copyMessage = async (
    message: ChatMessage,
  ) => {
    try {
      await navigator.clipboard.writeText(
        message.content,
      );

      setCopiedId(message.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch {
      // Clipboard access may be unavailable.
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setInput("");
    setEditingId(null);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120]">
      <button type="button" aria-label="Close MEO Assistant" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <Bot
                size={20}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                  MEO Assistant
                </h2>

                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Global Ecommerce
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              to="/admin/ai"
              onClick={() => setOpen(false)}
              className="rounded-xl px-2.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              Full page
            </Link>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={
                  clearConversation
                }
                className="rounded-xl p-2 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                title="New conversation"
              >
                <MessageSquare
                  size={17}
                />
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
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
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
                    <Sparkles
                      size={25}
                      className="text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
                    How can I help?
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Ask me about your business,
                    products, orders, profit,
                    growth, or what the platform
                    still needs.
                  </p>

                  <div className="mt-6 grid gap-2 text-left">
                    {starterPrompts.map(
                      (prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() =>
                            void sendMessage(
                              prompt,
                            )
                          }
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                        >
                          {prompt}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map(
                  (message) => (
                    <div
                      key={message.id}
                      className={
                        message.role ===
                        "user"
                          ? "flex justify-end"
                          : "flex justify-start"
                      }
                    >
                      <div
                        className={
                          message.role ===
                          "user"
                            ? "max-w-[88%]"
                            : "max-w-[94%]"
                        }
                      >
                        <div
                          className={
                            message.role ===
                            "user"
                              ? "rounded-2xl rounded-br-md bg-slate-950 px-4 py-3 text-sm leading-6 text-white"
                              : "text-sm leading-6 text-slate-700 dark:text-slate-300"
                          }
                        >
                          {message.content
                            .split("\n")
                            .map(
                              (
                                line,
                                index,
                              ) => (
                                <p
                                  key={`${message.id}-${index}`}
                                  className={
                                    index >
                                    0
                                      ? "mt-2"
                                      : ""
                                  }
                                >
                                  {line ? renderAssistantContent(line) : "\u00a0"}
                                </p>
                              ),
                            )}
                        </div>

                        <div
                          className={
                            message.role ===
                            "user"
                              ? "mt-1 flex justify-end gap-1"
                              : "mt-2 flex justify-start gap-1"
                          }
                        >
                          {message.role ===
                            "user" && (
                            <button
                              type="button"
                              onClick={() =>
                                editMessage(
                                  message,
                                )
                              }
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                              title="Edit question"
                            >
                              <Edit3
                                size={13}
                              />
                            </button>
                          )}

                          {message.role ===
                            "assistant" && (
                            <button
                              type="button"
                              onClick={() =>
                                void copyMessage(
                                  message,
                                )
                              }
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                              title="Copy response"
                            >
                              {copiedId ===
                              message.id ? (
                                <Check
                                  size={13}
                                />
                              ) : (
                                <Copy
                                  size={13}
                                />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {loading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Thinking...
                  </div>
                )}

                <div
                  ref={messagesEndRef}
                />
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            {editingId && (
              <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Edit3 size={13} />
                  Editing your question
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setInput("");
                  }}
                  className="rounded-lg p-1 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <form
              onSubmit={submit}
              className="relative"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) =>
                  setInput(
                    event.target.value,
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                disabled={loading}
                rows={3}
                placeholder="Message MEO Assistant..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  !input.trim()
                }
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between px-1">
              <p className="text-[10px] text-slate-400">
                Enter to send · Shift + Enter
                for a new line
              </p>

              <ChevronDown
                size={13}
                className="text-slate-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
