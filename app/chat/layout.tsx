import UserSidebar from "@/components/layout/sidebar/UserSidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={45}>
          <UserSidebar />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel>{children}</ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}
