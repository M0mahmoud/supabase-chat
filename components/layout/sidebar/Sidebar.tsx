"use client";
import { House, Mails, Settings, User } from "lucide-react";
import React from "react";
import { ModeToggle } from "@/components/layout/ThemeToggle";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <div className="flex flex-col max-h-dvh min-h-dvh p-4 justify-between items-center shadow border-e sticky top-0 left-0 w-[80px]">
      <div className="flex flex-col justify-center items-center">
        <div className="bg-blue-600 text-white p-4 rounded-lg mb-8 select-none">
          M05
        </div>
        <div className="flex flex-col gap-8">
          <Link href="/">
            <House
              size={24}
              className={pathname === "/" ? "stroke-blue-600" : ""}
            />
          </Link>
          <Link href="/chat">
            <Mails
              size={24}
              className={pathname === "/chat" ? "stroke-blue-600" : ""}
            />
          </Link>
          <Link href="/search">
            <User
              size={24}
              className={pathname === "/profile" ? "stroke-blue-600" : ""}
            />
          </Link>
        </div>
      </div>
      <div>
        <div className="cursor-pointer space-y-4 flex flex-col items-center">
          <Settings size={24} className="" />
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
