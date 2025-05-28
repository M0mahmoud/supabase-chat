"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { AVATAR_URL } from "@/utils/constants";
import { createClient } from "@/utils/supabase/client";
import { User } from "@/types/index";
import Loading from "../layout/Loading";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import nprogress from "nprogress";

export default function UserList() {
  const supabase = createClient();
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      const { data: usersData, error } = await supabase
        .from("users")
        .select("*")
        .neq("id", currentUser?.id);

      if (error) {
        toast.error("Failed to fetch users");
        setIsLoading(false);
        return;
      }

      setUsers(usersData || []);
      setIsLoading(false);
    };

    fetchUsers();
  }, [currentUser?.id]);

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col gap-4 w-full max-w-[991px] mx-auto">
      {users.map((user) => (
        <UserItem key={user.id} user={user} />
      ))}
    </div>
  );
}

function UserItem({ user }: { user: User }) {
  const supabase = createClient();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!currentUser?.id) return;
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

      // Redirect to chat
      router.push(`/chat/${chatId}?username=${user.username}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to start chat");
    } finally {
      setLoading(false);
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
