import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, ImagePlus, X, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const ChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // { base64, preview }
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      setPendingImage({ base64, preview: reader.result, name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !pendingImage) return;

    const userContent = [];
    if (pendingImage) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${pendingImage.base64}` },
      });
    }
    if (text) {
      userContent.push({ type: "text", text });
    }

    const userMsg = {
      role: "user",
      content: userContent.length === 1 && userContent[0].type === "text" ? text : userContent,
      displayText: text,
      imagePreview: pendingImage?.preview || null,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setPendingImage(null);
    setIsLoading(true);

    // Build API messages (strip display-only fields)
    const apiMessages = newMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantSoFar += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      toast.error(err.message || "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">AI Assistant</h1>
              <p className="text-xs text-slate-500">Ask anything · Analyze photos</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-700">How can I help?</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Ask me anything about HVAC, or send a photo for analysis — equipment, panels, venting, serial numbers, and more.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {["What size furnace do I need?", "Analyze this equipment photo", "Tankless installation requirements"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                }`}
              >
                {msg.imagePreview && (
                  <img src={msg.imagePreview} alt="Uploaded" className="rounded-lg max-h-48 mb-2" />
                )}
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-slate max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                    <ReactMarkdown>{typeof msg.content === "string" ? msg.content : ""}</ReactMarkdown>
                  </div>
                ) : (
                  <span>{msg.displayText || (typeof msg.content === "string" ? msg.content : "📷 Photo")}</span>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {pendingImage && (
            <div className="mb-2 inline-flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1.5">
              <img src={pendingImage.preview} alt="" className="h-10 w-10 rounded object-cover" />
              <span className="text-xs text-slate-600 truncate max-w-[120px]">{pendingImage.name}</span>
              <button onClick={() => setPendingImage(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-9 w-9 text-slate-500"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-5 h-5" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or attach a photo..."
              className="min-h-[40px] max-h-[120px] resize-none text-sm"
              rows={1}
            />
            <Button
              size="icon"
              className="flex-shrink-0 h-9 w-9"
              onClick={sendMessage}
              disabled={isLoading || (!input.trim() && !pendingImage)}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
