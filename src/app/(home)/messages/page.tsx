import { HydrateClient } from "~/trpc/server";
import { SidebarLayout } from "../_components/sidebar/sidebar-layout";

export default function MessagesPage() {
  return (
    <HydrateClient>
      <SidebarLayout variant="full-width" forceMinimized>
        <div className="flex h-full min-h-screen">
          <div className="flex w-full">
            <div className="w-1/3 border-r border-border/40 bg-card">
              <div className="p-4">
                <h2 className="text-lg font-semibold">Messages</h2>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="flex-1">
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-muted-foreground">
                        Hey there!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="flex-1">
                      <p className="font-medium">Jane Smith</p>
                      <p className="text-sm text-muted-foreground">
                        How are you?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </HydrateClient>
  );
}
