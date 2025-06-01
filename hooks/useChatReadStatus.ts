"use client";
import { useEffect, useState } from "react";

export function useChatReadStatus() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    // Function to extract chat ID from current URL
    const updateCurrentChatId = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const chatMatch = path.match(/\/chat\/([^\/]+)/);
        setCurrentChatId(chatMatch ? chatMatch[1] : null);
      }
    };

    // Update on mount
    updateCurrentChatId();

    // Listen for URL changes (for SPA navigation)
    const handlePopState = () => updateCurrentChatId();
    window.addEventListener('popstate', handlePopState);

    // For Next.js router changes, you might need to listen to router events
    // This is a fallback that checks periodically
    const interval = setInterval(updateCurrentChatId, 1000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(interval);
    };
  }, []);

  const isChatOpen = (chatId: string) => currentChatId === chatId;

  return { currentChatId, isChatOpen };
}