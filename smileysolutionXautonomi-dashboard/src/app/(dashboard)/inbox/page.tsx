import { InboxView } from "@/components/board/InboxView";
import { ToastProvider } from "@/components/ui/Toast";

export default function InboxPage() {
  return (
    <>
      <InboxView />
      <ToastProvider />
    </>
  );
}
