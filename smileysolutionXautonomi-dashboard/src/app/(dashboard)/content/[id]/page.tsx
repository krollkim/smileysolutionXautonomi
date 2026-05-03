import { ContentEditor } from "@/components/editor/ContentEditor";
import { ToastProvider } from "@/components/ui/Toast";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentEditorPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <>
      <ContentEditor id={id} />
      <ToastProvider />
    </>
  );
}
