"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import ChatMessageItem from "@/components/ChatMessages/ChatMessageItem";
import ChatHeader from "@/components/ChatMessages/ChatHeader";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Loading from "@/components/layout/Loading";
import { createClient } from "@/utils/supabase/client";

interface OtherUser {
  id: string;
  username: string;
  avatar_url?: string;
}

interface UserPresence {
  user_id: string;
  username: string;
  online_at: string;
  last_active?: string;
}

export default function UserChat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ChatID } = use(params);
  const param = useSearchParams();
  const { user, isLoading } = useAuth();
  const supabase = createClient();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [presenceState, setPresenceState] = useState<
    Record<string, UserPresence[]>
  >({});
  const [channel, setChannel] = useState<any>(null);

  // Use authenticated user's username or fallback to URL param
  const currentUsername =
    user?.user_metadata?.username || param.get("username") || "Anonymous";

  const { isConnected, messages, sendMessage } = useRealtimeChat({
    roomName: ChatID,
    username: currentUsername,
  });

  // Fetch other user's data (without online status)
  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!user?.id || !ChatID) return;

      try {
        // Get chat data to find the other user
        const { data: chatData, error: chatError } = await supabase
          .from("chats")
          .select(
            `
            user1_id,
            user2_id,
            user1:user1_id(id, username, avatar_url),
            user2:user2_id(id, username, avatar_url)
          `
          )
          .eq("id", ChatID)
          .single();

        if (chatError) {
          console.error("Error fetching chat:", chatError);
          return;
        }

        // Determine which user is the "other" user
        const otherUserData =
          chatData.user1_id === user.id ? chatData.user2 : chatData.user1;

        if (
          otherUserData &&
          Array.isArray(otherUserData) &&
          otherUserData.length > 0
        ) {
          setOtherUser(otherUserData[0] as OtherUser);
        } else if (otherUserData && !Array.isArray(otherUserData)) {
          setOtherUser(otherUserData as OtherUser);
        }
      } catch (error) {
        console.error("Error fetching other user:", error);
      }
    };

    fetchOtherUser();
  }, [user?.id, ChatID, supabase]);

  // Setup presence tracking
  useEffect(() => {
    if (!user?.id || !currentUsername || !ChatID) return;

    const presenceChannel = supabase.channel(`chat-presence-${ChatID}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        console.log("Presence sync:", state);
        // @ts-ignore
        setPresenceState(state);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
        // @ts-ignore
        setPresenceState((prev) => ({
          ...prev,
          [key]: newPresences,
        }));
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
        setPresenceState((prev) => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track current user's presence
          await presenceChannel.track({
            user_id: user.id,
            username: currentUsername,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(presenceChannel);

    // Cleanup on unmount
    return () => {
      presenceChannel.untrack();
      presenceChannel.unsubscribe();
    };
  }, [user?.id, currentUsername, ChatID, supabase]);

  // Update presence periodically to show "last active"
  useEffect(() => {
    if (!channel) return;

    const interval = setInterval(async () => {
      if (document.visibilityState === "visible") {
        await channel.track({
          user_id: user?.id,
          username: currentUsername,
          online_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        });
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [channel, user?.id, currentUsername]);

  // Handle page visibility changes
  useEffect(() => {
    if (!channel) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        // User is active, update presence
        await channel.track({
          user_id: user?.id,
          username: currentUsername,
          online_at: new Date().toISOString(),
        });
      } else {
        // User is away, update last active
        await channel.track({
          user_id: user?.id,
          username: currentUsername,
          online_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", () => {
      channel?.untrack();
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [channel, user?.id, currentUsername]);

  // Mark messages as read while viewing
  useEffect(() => {
    if (!ChatID || !user?.id) return;

    // Mark as read when component mounts
    const markAsRead = () => {
      const now = new Date().toISOString();
      localStorage.setItem(`lastRead_${user.id}_${ChatID}`, now);
    };

    // Mark as read immediately
    markAsRead();

    // Mark as read when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markAsRead();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [ChatID, user?.id]);

  // Mark as read when new messages arrive
  useEffect(() => {
    if (ChatID && user?.id && messages.length > 0) {
      const markAsRead = () => {
        const now = new Date().toISOString();
        localStorage.setItem(`lastRead_${user.id}_${ChatID}`, now);
      };

      const timeoutId = setTimeout(markAsRead, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, ChatID, user?.id]);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if other user is online
  const isOtherUserOnline = useMemo(() => {
    if (!otherUser?.id) return false;
    return Object.keys(presenceState).includes(otherUser.id);
  }, [presenceState, otherUser?.id]);

  // Get other user's last active time
  const otherUserLastActive = useMemo(() => {
    if (!otherUser?.id || !presenceState[otherUser.id]) return null;
    const userPresence = presenceState[otherUser.id][0];
    return userPresence?.last_active || userPresence?.online_at;
  }, [presenceState, otherUser?.id]);

  const allMessages = useMemo(() => {
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

  // Move early return to the top, before any other hooks
  if (isLoading) {
    return <Loading />;
  }
  return (
    <>
      <div className="flex flex-col w-full max-h-dvh h-dvh mx-auto">
        {/* Header with user data */}
        <ChatHeader
          username={otherUser?.username || "Loading..."}
          isOnline={isOtherUserOnline}
          lastActive={otherUserLastActive}
          avatarSeed={otherUser?.username}
        />

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
