"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import ChatMessageItem from "@/components/ChatMessages/ChatMessageItem";
import ChatHeader from "@/components/ChatMessages/ChatHeader";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import { useAuth } from "@/hooks/useAuth";
import Loading from "@/components/layout/Loading";

export default function UserChat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ChatID } = use(params);
  const { user, isLoading } = useAuth();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Use authenticated user's username or fallback to URL param
  const currentUsername = user?.user_metadata?.username || "Anonymous";

  const { isConnected, messages, sendMessage } = useRealtimeChat({
    roomName: ChatID,
    username: currentUsername,
  });

  const allMessages = useMemo(() => {
    // Ensure messages is an array and filter out invalid messages
    if (!Array.isArray(messages)) {
      console.warn("Messages is not an array:", messages);
      return [];
    }

    const validMessages = messages.filter((msg) => {
      return (
        msg &&
        typeof msg === "object" &&
        msg.id &&
        msg.content &&
        msg.user &&
        msg.user.name &&
        msg.createdAt
      );
    });

    const sortedMessages = validMessages.sort((a, b) => {
      try {
        return a.createdAt.localeCompare(b.createdAt);
      } catch (error) {
        console.error("Error sorting messages:", error, { a, b });
        return 0;
      }
    });

    return sortedMessages;
  }, [messages]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !isConnected) return;

      const message = newMessage.trim();

      // Send the message
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

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Show loading while auth is loading
  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="flex flex-col w-full max-h-dvh h-dvh mx-auto">
        {/* Header */}
        <ChatHeader />

        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-center py-2 text-sm">
            Connecting to chat...
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {allMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            allMessages.map((msg) => (
              <ChatMessageItem
                msg={msg}
                key={msg.id}
                isOwnMessage={msg.user.name === currentUsername}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form className="p-4" onSubmit={handleSendMessage}>
          <div className="flex items-center space-x-2">
            <div className="size-10 rounded-full flex items-center justify-center hover:bg-primary/10 cursor-pointer transition-colors">
              <Paperclip size={18} />
            </div>
            <div className="flex-1 relative">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isConnected ? "Type a message..." : "Connecting..."
                }
                className="w-full px-4 py-3 pr-12 rounded-lg border border-primary-foreground focus:ring-0 text-sm"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected}
                className="h-10 absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
