"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import ChatMessageItem from "@/components/ChatMessages/ChatMessageItem";
import ChatHeader from "@/components/ChatMessages/ChatHeader";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import { useSearchParams } from "next/navigation";

export default function UserChats() {
  const param = useSearchParams();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { isConnected, messages, sendMessage } = useRealtimeChat({
    roomName: "florencio-dorrance",
    username: param.get("username") || "Anonymous",
  });

  const allMessages = useMemo(() => {
    // Sort by creation date
    const sortedMessages = messages.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
    return sortedMessages;
  }, [messages]);

  // useEffect(() => {
  //   if (onMessage) {
  //     onMessage(allMessages);
  //   }
  // }, [allMessages, onMessage]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !isConnected) return;

      const message = newMessage.trim();

      sendMessage(message);
      setNewMessage("");
    },
    [newMessage, isConnected, sendMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage(e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <div className="flex flex-col w-full max-h-dvh h-dvh mx-auto">
        {/* Header */}
        <ChatHeader />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {allMessages.map((msg) => (
            <ChatMessageItem
              msg={msg}
              key={msg.id}
              isOwnMessage={msg.user.name === "Mahmoud"}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form className="p-4" onSubmit={handleSendMessage}>
          <div className="flex items-center space-x-2">
            <div className="size-10 rounded-full flex items-center justify-center">
              <Paperclip size={18} />
            </div>
            <div className="flex-1 relative">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message"
                className="w-full px-4 py-3 rounded-lg border border-primary-foreground focus:ring-0 text-sm"
              />
              <button
                type="submit"
                className="h-10 absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
