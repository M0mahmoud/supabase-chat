"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { AVATAR_URL } from "@/utils/constants";
import { createClient } from "@/utils/supabase/client";
import { User } from "@/types/index";
import { User as AuthUser } from "@supabase/supabase-js";
import Loading from "../layout/Loading";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import nprogress from "nprogress";

const supabase = createClient();

export default function UserList() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      // Wait for auth to load and ensure user exists
      if (authLoading) return;

      if (!currentUser?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data: usersData, error } = await supabase
          .from("users")
          .select("*")
          .neq("id", currentUser.id); // Now currentUser.id is guaranteed to exist

        if (error) throw error;

        setUsers(usersData || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();

    // Real-time subscription
    const channel = supabase
      .channel("users")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
          filter: `id=neq.${currentUser?.id}`,
        },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              setUsers((prev) => [...prev, payload.new as User]);
              break;
            case "UPDATE":
              setUsers((prev) =>
                prev.map((user) =>
                  user.id === payload.new.id ? (payload.new as User) : user
                )
              );
              break;
            case "DELETE":
              setUsers((prev) =>
                prev.filter((user) => user.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to user changes");
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, authLoading, supabase]);

  if (authLoading || isLoading) return <Loading />;

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500">Please log in to view users</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-[991px] mx-auto">
      {users.map((user) => (
        <UserItem key={user.id} user={user} currentUser={currentUser} />
      ))}
    </div>
  );
}
function UserItem({
  user,
  currentUser,
}: {
  user: User;
  currentUser: AuthUser | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!currentUser?.id) {
      toast.error("Please log in to start a chat");
      return;
    }

    setLoading(true);
    nprogress.start();

    try {
      const { data: existingChat } = await supabase
        .from("chats")
        .select("*")
        .or(
          `and(user1_id.eq.${currentUser.id},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${currentUser.id})`
        )
        .maybeSingle();

      let chatId = existingChat?.id;

      if (!chatId) {
        const { data: newChat, error } = await supabase
          .from("chats")
          .insert({
            user1_id: currentUser.id,
            user2_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        chatId = newChat.id;
      }
      // Use user metadata username or fallback
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat");
    } finally {
      setLoading(false);
      nprogress.done();
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border border-black/20 dark:border-white/20 rounded-lg w-full">
      <div className="flex items-center gap-4">
        <Image
          src={`${AVATAR_URL}seed=${user.id}`}
          alt="User Avatar"
          width={40}
          height={40}
          className="rounded-full"
          loading="lazy"
          unoptimized
        />
        <span className="text-lg font-semibold">{user.username}</span>
      </div>
      <Button
        onClick={handleStartChat}
        className={cn(
          "px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
        )}
        disabled={loading}
      >
        {loading ? "Loading..." : "Send Message"}
      </Button>
    </div>
  );
}
