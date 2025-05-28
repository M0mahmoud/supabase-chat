"use client";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { AVATAR_URL } from "@/utils/constants";
import { createClient } from "@/utils/supabase/client";
import { Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function UserSidebar() {
  const { user: currentUser } = useAuth();
  const supabase = createClient();
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchChats = async () => {
      const { data, error } = await supabase
        .from("chats")
        .select(
          "id, user1_id, user2_id, user1:user1_id(username, avatar_url), user2:user2_id(username, avatar_url)"
        )
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

      console.log("🚀 ~ fetchChats ~ data:", data);
      if (!error && data) {
        const formatted = data.map((chat) => ({
          id: chat.id,
          username:
            chat.user1_id === currentUser.id
              ? (chat.user2 as unknown as { username: string }).username ||
                "Unknown User"
              : (chat.user1 as unknown as { username: string }).username ||
                "Unknown User",
          message: "Start chatting",
          time: "",
          unreadCount: 0,
        }));
        setChats(formatted);
      }
    };

    fetchChats();
  }, [currentUser]);

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
              placeholder="Search..."
              className="w-full ps-10 h-12 pe-4 py-3 bg-primary-foreground border-0 rounded-lg text-blue-600 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {chats.length > 0 && (
            <div>
              <h3 className="text-xs text-gray-500 font-semibold px-4 pt-4 pb-1 uppercase">
                Chats
              </h3>
              {chats.map((conv) => (
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="truncate text-gray-900 dark:text-white">
                          {conv.username}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {conv.time}
                        </span>
                      </div>
                      <p className="text-sm truncate text-gray-600 dark:text-gray-300">
                        {conv.message}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
