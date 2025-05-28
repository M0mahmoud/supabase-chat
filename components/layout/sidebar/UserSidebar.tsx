"use client";
import { Input } from "@/components/ui/input";
import { AVATAR_URL } from "@/utils/constants";
import { Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const conversations = [
  {
    id: 1,
    name: "Mahmoud Mohamed",
    message: "Haha oh man 😊 Mahmoud Mohamed Ask For Content",
    time: "12m",
    unreadCount: 14,
    avatar:
      "https://api.dicebear.com/9.x/lorelei/svg?seed=1&backgroundType=gradientLinear&backgroundColor=ff6b6b",
  },
  {
    id: 2,
    name: "Ali_3433",
    message: "woohoooo",
    time: "24m",
    avatar: AVATAR_URL + "seed=2",
  },
  {
    id: 434,
    name: "Rawan Alaa",
    message: "omg, this is amazing",
    time: "5h",
    avatar: AVATAR_URL + "seed=4",
  },
  {
    id: 2235,
    name: "Asmaa13403",
    message: "woohoooo",
    time: "24m",
    avatar: AVATAR_URL + "seed=2",
  },
  {
    id: 1235,
    name: "Elmer Laverty",
    message: "Haha oh man 😊",
    time: "12m",
    avatar:
      "https://api.dicebear.com/9.x/lorelei/svg?seed=1&backgroundType=gradientLinear&backgroundColor=ff6b6b",
  },
  {
    id: 252,
    name: "Florencio Dorrance",
    message: "woohoooo",
    time: "24m",
    avatar: AVATAR_URL + "seed=2",
  },
  {
    id: 42534,
    name: "Titus Kitamura",
    message: "omg, this is amazing",
    time: "5h",
    avatar: AVATAR_URL + "seed=4",
  },
  {
    id: 222535,
    name: "Florencio Dorrance",
    message: "woohoooo",
    time: "24m",
    avatar: AVATAR_URL + "seed=2",
  },
  {
    id: 32253,
    name: "Lavern Laboy",
    message: "Haha that's terrifying 😄",
    time: "1h",
    avatar: AVATAR_URL + "seed=3",
  },
  {
    id: 25,
    name: "Titus Kitamura",
    message: "omg, this is amazing",
    time: "5h",
    avatar: AVATAR_URL + "seed=4",
  },
  {
    id: 255,
    name: "Geoffrey Mott",
    message: "aww 😊",
    time: "2d",
    avatar: AVATAR_URL + "seed=5",
  },
];
export default function UserSidebar() {
  const pathname = usePathname();
  if (pathname.split("/")[0] === "/chat") return null; // Only render if on the chat page

  return (
    <>
      {/* Desktop Version */}
      <div className="hidden md:flex h-screen border-e dark:border-white/20 border-black/20 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-white/20 border-black/20">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-blue-600 leading-[1.1]">
              Messages
            </h1>
            <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full size-6 flex items-center justify-center">
              12
            </span>
          </div>
          <Link
            href={"/"}
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
              className="w-full ps-10 h-12 pe-4 py-3 bg-primary-foreground border-0 rounded-lg text-blue-600 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 bluebg-blue-600-white transition-all"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {conversations.map((conversation) => (
            <Link
              href={`/chat/${conversation.id}`}
              key={conversation.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors border-b dark:border-white/20 border-black/20 last:border-b-0 block"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Image
                    src={conversation.avatar}
                    alt={`${conversation.name}'s avatar`}
                    className="w-12 h-12 rounded-full"
                    unoptimized
                    width={48}
                    height={48}
                  />
                  {/* Online indicator */}
                  {conversation.id <= 2 && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                  {/* New message indicator */}
                  {(conversation?.unreadCount || 0) > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500  text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-medium truncate ${
                        conversation.unreadCount || 0 > 0
                          ? "text-blue-600 font-semibold"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {conversation.name}
                    </h3>
                    <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                      {conversation.time}
                    </span>
                  </div>

                  <p
                    className={`text-sm truncate mb-2 ${
                      conversation.unreadCount || 0 > 0
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-600"
                    }`}
                    title={conversation.message}
                  >
                    {conversation.message}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Version - Avatar Only */}
      <div className="md:hidden w-16 h-screen border-e dark:border-white/20 border-black/20 flex flex-col bg-white dark:bg-gray-900">
        {/* Header - Just the plus button */}
        <div className="flex items-center justify-center p-3 border-b dark:border-white/20 border-black/20">
          <Link
            href={"/"}
            className="w-10 h-10 bg-blue-600 hover:rotate-180 transition-all text-white rounded-full flex items-center justify-center rotate-0"
          >
            <Plus size={18} />
          </Link>
        </div>

        {/* Avatar List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {conversations.map((conversation) => (
            <Link
              href={`/chat/${conversation.id}`}
              key={conversation.id}
              className="flex items-center justify-center p-2 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <div className="relative">
                <Image
                  src={conversation.avatar}
                  alt={`${conversation.name}'s avatar`}
                  className="w-10 h-10 rounded-full"
                  unoptimized
                  width={40}
                  height={40}
                />
                {/* Online indicator */}
                {conversation.id <= 2 && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
                {/* New message indicator */}
                {(conversation?.unreadCount || 0) > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500  text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {conversation.unreadCount || 0 > 9
                      ? "9+"
                      : conversation.unreadCount}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
