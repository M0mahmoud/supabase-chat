import { AVATAR_URL } from "@/utils/constants";
import { Phone } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function ChatHeader() {
  return (
    <div className="max-h-[73px] flex items-center justify-between p-4 bg-primary-foreground border-b dark:border-white/20 border-black/20">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Image
            src={AVATAR_URL + "seed=2"}
            alt="Florencio Dorrance"
            width={40}
            height={40}
            unoptimized
            loading="lazy"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div>
          <h2 className="font-semibold">Florencio Dorrance</h2>
          <p className="text-sm text-green-500">Online</p>
        </div>
      </div>
      <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-white cursor-progress rounded-full">
        <Phone className="w-4 h-4" />
        <span className="text-sm font-medium">Call</span>
      </button>
    </div>
  );
}
