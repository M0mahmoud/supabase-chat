"use client";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
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
  created_at: string;
  unreadCount: number;
  lastMessageTime: string;
  isOnline?: boolean;
}

export default function UserSidebar() {
  const { user: currentUser } = useAuth();
  const supabase = createClient();
  const [chats, setChats] = useState<ChatWithLastMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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
            user1:user1_id(username, avatar_url, is_online),
            user2:user2_id(username, avatar_url, is_online)
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
            const otherUserData = otherUser as unknown as {
              username: string;
              avatar_url?: string;
              created_at: string;
              is_online?: boolean;
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

            // Count unread messages (messages not sent by current user)
            const { count: unreadCount } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("chat_id", chat.id)
              .neq("sender_id", currentUser.id);

            const lastMessage = lastMessageData?.content || "Start chatting";
            const lastMessageTime =
              // @ts-ignore
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
              unreadCount: unreadCount || 0,
              lastMessageTime: lastMessageTime,
              isOnline: otherUserData?.is_online || false,
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

        // @ts-ignore
        setChats(sortedChats);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChatsWithLastMessage();
  }, [currentUser?.id, supabase]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("New message received:", payload);
          // Refresh chats when a new message is received
          refreshChats();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `is_online=eq.true`,
        },
        (payload) => {
          console.log("User online status changed:", payload);
          // Update online status for users
          setChats((prevChats) =>
            prevChats.map((chat) => {
              if (payload.new.username === chat.username) {
                return { ...chat, isOnline: payload.new.is_online };
              }
              return chat;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, supabase]);

  const refreshChats = async () => {
    if (!currentUser?.id) return;

    try {
      const { data: chatsData, error } = await supabase
        .from("chats")
        .select(
          `
          id,
          user1_id,
          user2_id,
          user1:user1_id(username, avatar_url, is_online),
          user2:user2_id(username, avatar_url, is_online)
        `
        )
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

      if (error || !chatsData) return;

      const chatsWithMessages = await Promise.all(
        chatsData.map(async (chat) => {
          const otherUser =
            chat.user1_id === currentUser.id ? chat.user2 : chat.user1;
          const otherUserData = otherUser as unknown as {
            username: string;
            avatar_url?: string;
            is_online?: boolean;
          };

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

          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("chat_id", chat.id)
            .neq("sender_id", currentUser.id);

          const lastMessage = lastMessageData?.content || "Start chatting";
          const lastMessageTime = lastMessageData?.created_at || "";
          // @ts-ignore
          const senderName = lastMessageData?.users?.username;

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
            unreadCount: unreadCount || 0,
            lastMessageTime: lastMessageTime,
            isOnline: otherUserData?.is_online || false,
          };
        })
      );

      const sortedChats = chatsWithMessages.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return (
          new Date(b.lastMessageTime).getTime() -
          new Date(a.lastMessageTime).getTime()
        );
      });

      // @ts-ignore
      setChats(sortedChats);
    } catch (error) {
      console.error("Error refreshing chats:", error);
    }
  };

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
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.username.toLowerCase().includes(searchTerm.toLowerCase())
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
            <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full size-6 flex items-center justify-center">
              {chats.length}
            </span>
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
                  href={`/chat/${conv.id}?username=${conv.username}`}
                  key={conv.id}
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
                      {/* Online indicator */}
                      {conv.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="truncate text-gray-900 dark:text-white font-medium">
                          {conv.username}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {conv.time}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm truncate text-gray-600 dark:text-gray-300 mt-1">
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
