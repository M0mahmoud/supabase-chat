import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AVATAR_URL } from "@/utils/constants";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center justify-center h-full w-full py-4">
        <div className="flex flex-col items-center justify-center mb-8">
          <h1 className="text-3xl font-bold mb-1">Online Users</h1>
          <p className="text-gray-500">
            This is a simple chat application built with Next.js and Supabase.
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-[991px] mx-auto">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border-[0.5px] border-black/20 dark:border-white/20  rounded-lg w-full"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={`${AVATAR_URL}seed=${
                    index + 1
                  }`}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                  loading="lazy"
                  unoptimized
                />
                <span className="text-lg font-semibold">User {index + 1}</span>
              </div>
              <Button
                className={cn(
                  "px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors",
                  index === 2 ? "cursor-not-allowed select-none" : ""
                )}
                disabled={index === 2}
              >
                {index === 2 ? "Request Sent" : "Send Request"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
