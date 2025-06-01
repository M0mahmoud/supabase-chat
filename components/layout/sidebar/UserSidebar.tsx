"use client";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useChatReadStatus } from "@/hooks/useChatReadStatus";
import { AVATAR_URL } from "@/utils/constants";
import { createClient } from "@/utils/supabase/client";
import { Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface ChatWithLastMessage {
  id: string;
  username: string;
  message: string;
  time: string;
  unreadCount: number;
  lastMessageTime: string;
  isOnline: boolean;
  otherUserId: string;
}

export default function UserSidebar() {
  const { user: currentUser } = useAuth();
  const supabase = createClient();
  const [chats, setChats] = useState<ChatWithLastMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { isChatOpen } = useChatReadStatus();

  // Get read messages from localStorage
  const getReadMessages = (): Record<string, string[]> => {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem(`readMessages_${currentUser?.id}`);
    return stored ? JSON.parse(stored) : {};
  };

  // Save read messages to localStorage
  const saveReadMessages = (readMessages: Record<string, string[]>) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      `readMessages_${currentUser?.id}`,
      JSON.stringify(readMessages)
    );
  };

  // Get last read timestamp for a chat
  const getLastReadTimestamp = (chatId: string): string | null => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(
      `lastRead_${currentUser?.id}_${chatId}`
    );
    return stored || null;
  };

  // Save last read timestamp for a chat
  const saveLastReadTimestamp = (chatId: string, timestamp: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`lastRead_${currentUser?.id}_${chatId}`, timestamp);
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchChatsWithLastMessage = async () => {
      try {
        // First get all chats for the current user
        const { data: chatsData, error: chatsError } = await supabase
          .from("chats")
          .select(
            `
            id,
            user1_id,
            user2_id,
            created_at,
            user1:user1_id(username, avatar_url),
            user2:user2_id(username, avatar_url)
          `
          )
          .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

        if (chatsError) {
          console.error("Error fetching chats:", chatsError);
          return;
        }

        if (!chatsData || chatsData.length === 0) {
          setChats([]);
          return;
        }

        // Get last message for each chat
        const chatsWithMessages = await Promise.all(
          chatsData.map(async (chat) => {
            // Get the other user's info
            const otherUser =
              chat.user1_id === currentUser.id ? chat.user2 : chat.user1;
            const otherUserId =
              chat.user1_id === currentUser.id ? chat.user2_id : chat.user1_id;
            const otherUserData = otherUser as unknown as {
              username: string;
              avatar_url?: string;
            };

            // Get the last message for this chat
            const { data: lastMessageData } = await supabase
              .from("messages")
              .select(
                `
                content,
                created_at,
                sender_id,
                users!messages_sender_id_fkey(username)
              `
              )
              .eq("chat_id", chat.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            // Calculate unread count based on last read timestamp
            const lastReadTimestamp = getLastReadTimestamp(chat.id);
            let unreadCount = 0;

            if (lastReadTimestamp) {
              // Count messages from other users after the last read timestamp
              const { count } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("chat_id", chat.id)
                .neq("sender_id", currentUser.id)
                .gt("created_at", lastReadTimestamp);

              unreadCount = count || 0;
            } else {
              // If no last read timestamp, count all messages from other users
              const { count } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("chat_id", chat.id)
                .neq("sender_id", currentUser.id);

              unreadCount = count || 0;
            }

            const lastMessage = lastMessageData?.content || "Start chatting";
            const lastMessageTime =
              lastMessageData?.created_at || chat.created_at || "";
            // @ts-ignore
            const senderName = lastMessageData?.users?.username;

            // Format the message display
            let displayMessage = lastMessage;
            if (lastMessageData) {
              if (lastMessageData.sender_id === currentUser.id) {
                displayMessage = `You: ${lastMessage}`;
              } else if (senderName) {
                displayMessage = `${senderName}: ${lastMessage}`;
              }
            }

            return {
              id: chat.id,
              username: otherUserData?.username || "Unknown User",
              message: displayMessage,
              time: formatTime(lastMessageTime),
              unreadCount,
              lastMessageTime,
              isOnline: false, // Will be updated by presence
              otherUserId,
            };
          })
        );

        // Sort by last message time (most recent first)
        const sortedChats = chatsWithMessages.sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return (
            new Date(b.lastMessageTime).getTime() -
            new Date(a.lastMessageTime).getTime()
          );
        });

        setChats(sortedChats);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChatsWithLastMessage();
  }, [currentUser?.id, supabase]);

  // Enhanced real-time subscription for new messages
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel("chat-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("New message received:", payload);
          const newMessage = payload.new;

          // Update the specific chat with new message
          setChats((prevChats) =>
            prevChats.map((chat) => {
              if (chat.id === newMessage.chat_id) {
                const isFromCurrentUser =
                  newMessage.sender_id === currentUser.id;
                const isChatCurrentlyOpen = isChatOpen(chat.id);

                // Only increment unread count if:
                // 1. Message is not from current user AND
                // 2. Chat is not currently open
                const shouldIncrementUnread =
                  !isFromCurrentUser && !isChatCurrentlyOpen;

                // If chat is currently open and message is from other user, mark as read
                if (isChatCurrentlyOpen && !isFromCurrentUser) {
                  const now = new Date().toISOString();
                  saveLastReadTimestamp(chat.id, now);
                }

                return {
                  ...chat,
                  message: isFromCurrentUser
                    ? `You: ${newMessage.content}`
                    : newMessage.content,
                  time: formatTime(newMessage.created_at),
                  lastMessageTime: newMessage.created_at,
                  unreadCount: shouldIncrementUnread
                    ? chat.unreadCount + 1
                    : chat.unreadCount,
                };
              }
              return chat;
            })
          );

          // Resort chats by latest message
          setChats((prevChats) => {
            const updatedChats = [...prevChats];
            return updatedChats.sort((a, b) => {
              if (!a.lastMessageTime) return 1;
              if (!b.lastMessageTime) return -1;
              return (
                new Date(b.lastMessageTime).getTime() -
                new Date(a.lastMessageTime).getTime()
              );
            });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, supabase, isChatOpen]);

  // Function to mark chat as read when clicked
  const markChatAsRead = (chatId: string) => {
    const now = new Date().toISOString();

    // Save the current timestamp as the last read time for this chat
    saveLastReadTimestamp(chatId, now);

    // Update the chat's unread count to 0 in the UI
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

  // Function to refresh unread counts (useful for debugging or manual refresh)
  const refreshUnreadCounts = async () => {
    if (!currentUser?.id) return;

    const updatedChats = await Promise.all(
      chats.map(async (chat) => {
        const lastReadTimestamp = getLastReadTimestamp(chat.id);
        let unreadCount = 0;

        if (lastReadTimestamp) {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("chat_id", chat.id)
            .neq("sender_id", currentUser.id)
            .gt("created_at", lastReadTimestamp);

          unreadCount = count || 0;
        } else {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("chat_id", chat.id)
            .neq("sender_id", currentUser.id);

          unreadCount = count || 0;
        }

        return { ...chat, unreadCount };
      })
    );

    setChats(updatedChats);
  };

  // Refresh unread counts when component mounts or when coming back to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshUnreadCounts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [chats.length]);

  const formatTime = (dateString: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total unread messages
  const totalUnreadCount = chats.reduce(
    (total, chat) => total + chat.unreadCount,
    0
  );

  return (
    <>
      {/* Desktop Version */}
      <div className="hidden md:flex h-screen border-e dark:border-white/20 border-black/20 flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-white/20 border-black/20">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-blue-600 leading-[1.1]">
              Messages
            </h1>
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
              </span>
            )}
          </div>
          <Link
            href="/"
            className="w-10 h-10 bg-blue-600 hover:rotate-180 transition-all text-white rounded-full flex items-center justify-center rotate-0"
          >
            <Plus size={20} />
          </Link>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-10 h-12 pe-4 py-3 bg-primary-foreground border-0 rounded-lg text-blue-600 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredChats.length > 0 ? (
            <div>
              <h3 className="text-xs text-gray-500 font-semibold px-4 pt-4 pb-1 uppercase">
                Recent Chats
              </h3>
              {filteredChats.map((conv) => (
                <Link
                  href={`/chat/${conv.id}`}
                  key={conv.id}
                  onClick={() => markChatAsRead(conv.id)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors border-b dark:border-white/20 border-black/20 block"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <Image
                        src={`${AVATAR_URL}seed=${conv.username}`}
                        alt={`${conv.username}'s avatar`}
                        className="w-12 h-12 rounded-full"
                        unoptimized
                        width={48}
                        height={48}
                      />
                      {/* Enhanced Online indicator */}
                      {conv.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full">
                          <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-gray-900 dark:text-white font-medium">
                            {conv.username}
                          </h3>
                          {/* Online status text indicator */}
                          {conv.isOnline && (
                            <span className="text-xs text-green-500 font-medium">
                              • Online
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {conv.time}
                          </span>
                          {/* Enhanced unread count badge */}
                          {conv.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[18px] h-5 flex items-center justify-center font-medium shadow-sm">
                              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p
                        className={`text-sm truncate mt-1 ${
                          conv.unreadCount > 0
                            ? "text-gray-900 dark:text-white font-medium"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {conv.message}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
