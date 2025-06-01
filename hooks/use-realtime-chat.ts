"use client";

import { ChatMessage } from "@/types";
import { EVENT_MESSAGE_TYPE } from "@/utils/constants";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";

interface UseRealtimeChatProps {
  roomName: string;
  username: string;
}

export function useRealtimeChat({ roomName, username }: UseRealtimeChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channel, setChannel] = useState<ReturnType<
    typeof supabase.channel
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newChannel = supabase.channel(roomName, {
      config: {
        broadcast: { self: true },
      },
    });

    newChannel
      .on("broadcast", { event: EVENT_MESSAGE_TYPE }, (payload) => {
        console.log("Received message:", payload);
        const newMessage = payload.payload as ChatMessage;

        setMessages((current) => {
          const exists = current.some((msg) => msg.id === newMessage.id);
          if (exists) {
            console.log("Message already exists, skipping:", newMessage.id);
            return current;
          }

          console.log("Adding new message:", newMessage);
          return [...current, newMessage];
        });
      })
      .subscribe(async (status) => {
        console.log("Channel status:", status);
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          console.log("Connected to channel:", roomName);
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          console.error("Channel error for:", roomName);
        } else if (status === "CLOSED") {
          setIsConnected(false);
          console.log("Channel closed:", roomName);
        }
      });

    setChannel(newChannel);

    return () => {
      console.log("Cleaning up channel:", roomName);
      newChannel.unsubscribe();
      setIsConnected(false);
    };
  }, [roomName, username, supabase]);

  // Fetch existing messages from database
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select(
            `
            id,
            content,
            created_at,
            sender_id,
            users!messages_sender_id_fkey (
              username
            )
          `
          )
          .eq("chat_id", roomName)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Failed to fetch messages:", error);
          return;
        }

        // Transform database messages to ChatMessage format
        const transformedMessages: ChatMessage[] = (data || []).map(
          (msg: any) => ({
            id: msg.id,
            content: msg.content,
            user: {
              name: msg.users?.username || "Unknown User",
            },
            createdAt: msg.created_at || new Date().toISOString(),
          })
        );

        console.log("Fetched messages:", transformedMessages);
        setMessages(transformedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    if (roomName) {
      fetchMessages();
    }
  }, [roomName, supabase]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected) {
        console.error("Cannot send message - not connected");
        return;
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user");
        return;
      }

      const messageId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      const message: ChatMessage = {
        id: messageId,
        content,
        user: {
          name: username,
        },
        createdAt,
      };

      try {
        // Store message in database first
        const { error: dbError } = await supabase.from("messages").insert({
          id: messageId,
          chat_id: roomName,
          sender_id: user.id,
          content: content,
          created_at: createdAt,
        });

        if (dbError) {
          console.error("Failed to store message in database:", dbError);
          return;
        }

        // Add message locally immediately
        setMessages((current) => [...current, message]);

        // Broadcast to other users
        const result = await channel.send({
          type: "broadcast",
          event: EVENT_MESSAGE_TYPE,
          payload: message,
        });

        console.log("Message send result:", result);

        if (result !== "ok") {
          console.error("Failed to broadcast message:", result);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [channel, isConnected, username, roomName, supabase]
  );

  return { messages, sendMessage, isConnected };
}
