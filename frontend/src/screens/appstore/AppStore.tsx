import { CirclePlus } from "lucide-react";
import AppHeader from "src/components/AppHeader";
import SuggestedApps from "src/components/SuggestedApps";
import { Button } from "src/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "src/components/ui/dialog";

function AppStore() {
  return (
    <>
      <AppHeader
        title="Apps"
        description="Apps that you can connect your wallet into"
        contentRight={
          <>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" className="hidden sm:flex">
                  How to connect to apps?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    How to connect to apps
                  </DialogTitle>
                  <DialogDescription>
                    Open the app you want to pair and scan this QR code to connect.
                  </DialogDescription>
                  <div className="flex flex-row justify-center pt-5">
                    To pair with NWC (Nostr Wallet Connect), open the target app and navigate to its settings. Here, you should find an option for NWC.
                  </div>
                </DialogHeader>
              </DialogContent>
            </Dialog>

            <a
              href="https://form.jotform.com/232284367043051"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Button variant="outline">
                <CirclePlus className="h-4 w-4 mr-2" />
                Submit your app
              </Button>
            </a>
          </>
        }
      />
      <SuggestedApps />
    </>
  );
}

export default AppStore;
