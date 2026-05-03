import { KanbanBoard } from "@/components/board/KanbanBoard";
import { ToastProvider } from "@/components/ui/Toast";

export default function BoardPage() {
  return (
    <>
      <KanbanBoard />
      <ToastProvider />
    </>
  );
}
