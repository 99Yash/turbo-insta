import { Modal } from "~/components/ui/modal";

export default function PostPage({ children }: { children: React.ReactNode }) {
  return <Modal showModal={true}>{children}</Modal>;
}
