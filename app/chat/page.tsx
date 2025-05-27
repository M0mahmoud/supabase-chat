"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Phone, Send } from "lucide-react";
import { AVATAR_URL } from "@/utils/constants";
import Image from "next/image";
import { Input } from "@/components/ui/input";

export default function UserChats() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "omg, this is amazing",
      sender: "florencio",
      timestamp: "now",
    },
    { id: 2, text: "perfect ✅", sender: "florencio", timestamp: "now" },
    {
      id: 3,
      text: "Wow, this is really epic",
      sender: "florencio",
      timestamp: "now",
    },
    { id: 4, text: "How are you?", sender: "user", timestamp: "now" },
    {
      id: 5,
      text: "just ideas for next time",
      sender: "florencio",
      timestamp: "now",
    },
    {
      id: 6,
      text: "I'll be there in 2 mins ⏰",
      sender: "florencio",
      timestamp: "now",
    },
    { id: 7, text: "woohoooo", sender: "user", timestamp: "now" },
    { id: 8, text: "Haha oh man", sender: "user", timestamp: "now" },
    {
      id: 9,
      text: "Haha that's terrifying 😂",
      sender: "user",
      timestamp: "now",
    },
    { id: 10, text: "aww", sender: "florencio", timestamp: "now" },
    {
      id: 11,
      text: "omg, this is amazing",
      sender: "florencio",
      timestamp: "now",
    },
    { id: 12, text: "woohoooo 🔥", sender: "florencio", timestamp: "now" },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          id: Date.now(),
          text: message,
          sender: "user",
          timestamp: "now",
        },
      ]);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <div className="flex flex-col w-full max-h-dvh h-dvh mx-auto">
        {/* Header */}
        <div className="max-h-[73px] flex items-center justify-between p-4 bg-primary-foreground border-b dark:border-white/20 border-black/20">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Image
                src={AVATAR_URL + "seed=2"}
                alt="Florencio Dorrance"
                width={40}
                height={40}
                unoptimized
                loading="lazy"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h2 className="font-semibold">Florencio Dorrance</h2>
              <p className="text-sm text-green-500">Online</p>
            </div>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-white cursor-progress rounded-full">
            <Phone className="w-4 h-4" />
            <span className="text-sm font-medium">Call</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex items-end space-x-2 max-w-xs">
                {msg.sender === "florencio" && (
                  <img
                    src={AVATAR_URL + "seed=2"}
                    alt="Florencio"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    msg.sender === "user"
                      ? "bg-primary-foreground text-white rounded-br-md"
                      : "bg-primary-foreground text-white rounded-bs-md"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
                {msg.sender === "user" && (
                  <img
                    src={AVATAR_URL + "seed=1"}
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-primary-foreground">
          <div className="flex items-center space-x-2">
            <div className="size-10 rounded-full flex items-center justify-center">
              <Paperclip size={18} />
            </div>
            <div className="flex-1 relative">
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message"
                className="w-full px-4 py-3 rounded-lg border border-primary-foreground focus:ring-0 text-sm"
              />
              <button
                onClick={handleSendMessage}
                className="h-10 absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
