import { ModeToggle } from "@/components/layout/ThemeToggle";

export default function Home() {
  return (
    <>
      <div className="flex justify-center items-center w-full h-full min-h-dvh max-w-[1660px] mx-auto">
        <ModeToggle />
      </div>
    </>
  );
}
