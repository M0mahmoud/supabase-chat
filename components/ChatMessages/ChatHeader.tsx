import { AVATAR_URL } from "@/utils/constants";
import { Phone, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface ChatHeaderProps {
  username?: string;
  isOnline?: boolean;
  lastActive: string | null;
  avatarSeed?: string;
}

export default function ChatHeader({
  username = "Unknown User",
  isOnline = false,
  lastActive,
  avatarSeed,
}: ChatHeaderProps) {
  const formatLastActive = (lastActiveString: string | null) => {
    if (!lastActiveString) return "";

    const lastActiveDate = new Date(lastActiveString);
    const now = new Date();
    const diffInMinutes =
      (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) return "Active now";
    if (diffInMinutes < 60) return `Active ${Math.floor(diffInMinutes)}m ago`;
    if (diffInMinutes < 1440)
      return `Active ${Math.floor(diffInMinutes / 60)}h ago`;
    return `Active ${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="max-h-[73px] flex items-center justify-between p-4 bg-primary-foreground border-b dark:border-white/20 border-black/20">
      <div className="flex items-center space-x-3">
        {/* Back button for mobile */}
        <Link
          href="/"
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="relative">
          <Image
            src={`${AVATAR_URL}seed=${avatarSeed || username}`}
            alt={`${username}'s avatar`}
            width={40}
            height={40}
            unoptimized
            loading="lazy"
            className="w-10 h-10 rounded-full object-cover"
          />
          {/* Online indicator */}
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800">
              <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {username}
          </h2>
          <p
            className={`text-sm ${
              isOnline ? "text-green-500" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {isOnline ? "Online" : formatLastActive(lastActive) || "Offline"}
          </p>
        </div>
      </div>

      <button
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
        onClick={() => {
          // Implement call functionality here
          console.log(`Calling ${username}...`);
        }}
      >
        <Phone className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Call</span>
      </button>
    </div>
  );
}
