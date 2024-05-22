import { CirclePlus } from "lucide-react";
import AppHeader from "src/components/AppHeader";
import SuggestedApps from "src/components/SuggestedApps";
import { Button } from "src/components/ui/button";

function AppStore() {
  return (
    <>
      <AppHeader
        title="Apps"
        description="Apps that you can connect your wallet to"
        contentRight={
          <>
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
