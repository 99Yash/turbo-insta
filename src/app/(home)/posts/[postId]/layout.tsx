import { Dialog, DialogContent } from "~/components/ui/dialog";

export default function ModalLayout({ children }: React.PropsWithChildren) {
  return (
    <Dialog defaultOpen={true}>
      <DialogContent className="max-w-screen-2xl overflow-hidden p-0">
        {children}
      </DialogContent>
    </Dialog>
  );
}
