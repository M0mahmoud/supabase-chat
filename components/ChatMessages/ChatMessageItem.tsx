import { ChatMessage } from "@/types";
import { AVATAR_URL } from "@/utils/constants";
import React from "react";

export default function ChatMessageItem({
  msg,
  isOwnMessage,
}: {
  msg: ChatMessage;
  isOwnMessage: boolean;
}) {
  return (
    <div
      key={msg.id}
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div className="flex items-end space-x-2 max-w-xs">
        {!isOwnMessage && (
          <img
            src={AVATAR_URL + "seed=" + msg.user.name}
            alt={msg.user.name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwnMessage
              ? "bg-primary-foreground text-white rounded-br-md"
              : "bg-primary-foreground text-white rounded-bs-md"
          }`}
        >
          <p className="text-sm">{msg.content}</p>
        </div>
        {isOwnMessage && (
          <img
            src={AVATAR_URL + "seed=" + msg.user.name}
            alt="You"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        )}
      </div>
    </div>
  );
}
