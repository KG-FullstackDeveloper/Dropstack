import {
  ArrowUp,
  Check,
  Copy,
  Plus,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

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

function makeId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function loadMessages(): Message[] {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is Message =>
        item &&
        (item.role === "user" ||
          item.role === "assistant") &&
        typeof item.content === "string",
    );
  } catch {
    return [];
  }
}


function renderAssistantContent(content: string) {
  const pattern = /\[([^\]]+)\]\((\/admin(?:\?[^)\s]+)?)\)/g;
  const parts: Array<{ type: "text" | "link"; value: string; label?: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "link", value: match[2], label: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return <span>{content}</span>;
  }

  return (
    <div className="space-y-3">
      {parts.map((part, index) =>
        part.type === "link" ? (
          <a
            key={`${part.value}-${index}`}
            href={part.value}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            {part.label}
          </a>
        ) : (
          <span key={`text-${index}`} className="whitespace-pre-wrap">
            {part.value}
          </span>
        ),
      )}
    </div>
  );
}

export default function MEOAI() {
  const [messages, setMessages] =
    useState<Message[]>(loadMessages);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] =
    useState<string | null>(null);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null);

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages),
    );
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  function focusComposer() {
    window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }

  function newConversation() {
    setMessages([]);
    setInput("");
    setEditingId(null);
    focusComposer();
  }

  async function sendMessage(
    explicitText?: string,
    replaceMessageId?: string,
  ) {
    const text =
      explicitText?.trim() ||
      input.trim();

    if (!text || loading) return;

    let nextMessages: Message[];

    if (replaceMessageId) {
      nextMessages = messages.map(
        (message) =>
          message.id === replaceMessageId
            ? {
                ...message,
                content: text,
              }
            : message,
      );
    } else {
      nextMessages = [
        ...messages,
        {
          id: makeId(),
          role: "user",
          content: text,
        },
      ];
    }

    setMessages(nextMessages);
    setInput("");
    setEditingId(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        "http://localhost:4000/api/ai",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: nextMessages.map(
              (message) => ({
                role: message.role,
                content: message.content,
              }),
            ),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to get an AI response.",
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
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content:
            error instanceof Error
              ? `I couldn't complete that request. ${error.message}`
              : "I couldn't complete that request.",
        },
      ]);
    } finally {
      setLoading(false);
      focusComposer();
    }
  }

  function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function copyMessage(
    message: Message,
  ) {
    try {
      await navigator.clipboard.writeText(
        message.content,
      );

      setCopiedId(message.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch {
      // Clipboard may be unavailable.
    }
  }

  function editMessage(message: Message) {
    setEditingId(message.id);
    setInput(message.content);
    focusComposer();
  }

  function regenerate(message: Message) {
    const index = messages.findIndex(
      (item) => item.id === message.id,
    );

    if (index < 1) return;

    const previousUserMessage =
      messages
        .slice(0, index)
        .reverse()
        .find(
          (item) => item.role === "user",
        );

    if (!previousUserMessage) return;

    const historyBeforeUser =
      messages.slice(
        0,
        messages.findIndex(
          (item) =>
            item.id ===
            previousUserMessage.id,
        ),
      );

    setMessages(historyBeforeUser);
    setLoading(true);

    void (async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const response = await fetch(
          "http://localhost:4000/api/ai",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              messages: [
                ...historyBeforeUser.map(
                  (item) => ({
                    role: item.role,
                    content: item.content,
                  }),
                ),
                {
                  role: "user",
                  content:
                    previousUserMessage.content,
                },
              ],
            }),
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Unable to regenerate response.",
          );
        }

        setMessages([
          ...historyBeforeUser,
          previousUserMessage,
          {
            id: makeId(),
            role: "assistant",
            content: String(
              data.answer || "",
            ),
          },
        ]);
      } catch (error) {
        setMessages([
          ...historyBeforeUser,
          previousUserMessage,
          {
            id: makeId(),
            role: "assistant",
            content:
              error instanceof Error
                ? `I couldn't regenerate that response. ${error.message}`
                : "I couldn't regenerate that response.",
          },
        ]);
      } finally {
        setLoading(false);
        focusComposer();
      }
    })();
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Sparkles size={18} />
            </div>

            <div>
              <p className="text-sm font-black">
                MEO AI
              </p>
              <p className="text-[11px] text-slate-400">
                Global Ecommerce
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={newConversation}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">
              New chat
            </span>
          </button>
        </header>

        <main className="flex flex-1 flex-col">
          {!hasMessages ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-xl">
                <Sparkles size={28} />
              </div>

              <h1 className="mt-6 text-center text-3xl font-black tracking-tight sm:text-4xl">
                How can I help with your business?
              </h1>

              <p className="mt-3 max-w-xl text-center text-sm leading-6 text-slate-500">
                Ask anything about your Global Ecommerce
                business. I can work with your actual
                products, orders and profitability data.
              </p>

              <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() =>
                      void sendMessage(starter)
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 px-4 py-8 sm:px-6">
              <div className="mx-auto max-w-3xl space-y-8">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role ===
                      "assistant" && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                        <Sparkles size={15} />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] ${
                        message.role === "user"
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      <div
                        className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${
                          message.role ===
                          "user"
                            ? "bg-slate-950 text-white"
                            : "text-slate-700"
                        }`}
                      >
                        {message.role === "assistant"
                          ? renderAssistantContent(message.content)
                          : message.content}
                      </div>

                      <div
                        className={`mt-2 flex items-center gap-1 ${
                          message.role ===
                          "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
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
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            Edit
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
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            {copiedId ===
                            message.id ? (
                              <Check size={13} />
                            ) : (
                              <Copy size={13} />
                            )}
                            {copiedId ===
                            message.id
                              ? "Copied"
                              : "Copy"}
                          </button>
                        )}

                        {message.role ===
                          "assistant" && (
                          <button
                            type="button"
                            onClick={() =>
                              regenerate(
                                message,
                              )
                            }
                            disabled={loading}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                          >
                            <RefreshCw
                              size={13}
                            />
                            Regenerate
                          </button>
                        )}
                      </div>
                    </div>

                    {message.role ===
                      "user" && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <UserRound size={15} />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                      <Sparkles size={15} />
                    </div>

                    <div className="flex items-center gap-1 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>
          )}

          <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-5 pt-6 sm:px-6">
            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-3xl"
            >
              {editingId && (
                <div className="mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <span>
                    Editing your message
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setInput("");
                    }}
                    className="font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="rounded-3xl border border-slate-300 bg-white p-2 shadow-xl shadow-slate-200/60">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Message MEO AI..."
                  className="max-h-40 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                />

                <div className="flex items-center justify-between px-2 pb-1">
                  <p className="hidden text-[11px] text-slate-400 sm:block">
                    Enter to send · Shift + Enter for a new line
                  </p>

                  <button
                    type="submit"
                    disabled={
                      !input.trim() ||
                      loading
                    }
                    className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
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
