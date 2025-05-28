"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { AVATAR_URL } from "@/utils/constants";
import { createClient } from "@/utils/supabase/client";
import { User } from "@/types/index";
import Loading from "../layout/Loading";

export default function UserList() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const users = await supabase.from("users").select("*");
      return users.data || ([] as User[]);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getUsers = async () => {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers || []);
    };
    getUsers();
  }, []);

  useEffect(() => {
    const channel = supabase.channel("users-list");
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "users" },
        (payload) => {
          const newTask = payload.new as User;
          setUsers((prev) => [...prev, newTask]);
        }
      )
      .subscribe((status) => {
        console.log("Subscription: ", status);
      });
  }, []);

  if (isLoading) {
    return <Loading />;
  }
  return (
    <>
      <div className="flex flex-col gap-4 w-full max-w-[991px] mx-auto">
        {users.map((user, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 border-[0.5px] border-black/20 dark:border-white/20  rounded-lg w-full"
          >
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
              className={cn(
                "px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors",
                index === 2 ? "cursor-not-allowed select-none" : ""
              )}
              disabled={index === 2}
            >
              {index === 2 ? "Message Sent" : "Send Message"}
            </Button>
          </div>
        ))}
      </div>
      {
        <button
          onClick={async () => {
            const supabase = createClient();
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error("Error signing out:", error);
            } else {
            }
          }}
        >
          Logout
        </button>
      }
    </>
  );
}
