"use client";

import UserList from "@/components/ChatMessages/UserList";
import Loading from "@/components/layout/Loading";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
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
    <>
      <div className="flex flex-col items-center justify-center h-full w-full p-4">
        <div className="flex flex-col items-center justify-center mb-8">
          <h1 className="text-3xl font-bold mb-1">Online Users</h1>
          <p className="text-gray-500">
            This is a simple chat application built with Next.js and Supabase.
          </p>
        </div>
        <UserList />
      </div>
    </>
  );
}
