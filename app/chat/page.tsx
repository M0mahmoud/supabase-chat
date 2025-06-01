"use client";

import { MessageCircle, Sparkles } from "lucide-react";
import Loading from "@/components/layout/Loading";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserChats() {
  const { isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <Loading />;
  }
  return (
    <div className="flex flex-col w-full max-h-dvh h-dvh mx-auto justify-center items-center">
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-8 text-center">
        {/* Main Icon with Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl ">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <Sparkles className="absolute -top-1 -left-1 w-5 h-5 text-yellow-400 animate-pulse" />
        </div>

        {/* Welcome Message */}
        <div className="mb-12 max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text ">
            Welcome to Chat
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            Choose a conversation or start a new chat to connect with friends
            and colleagues
          </p>
        </div>
      </div>
    </div>
  );
}
