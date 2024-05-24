import { CopyIcon } from "lucide-react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import AppHeader from "src/components/AppHeader";

import QRCode from "src/components/QRCode";
import { suggestedApps } from "src/components/SuggestedAppData";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card";
import { useToast } from "src/components/ui/use-toast";
import { copyToClipboard } from "src/lib/clipboard";
import { CreateAppResponse } from "src/types";

export default function AppConnect() {
  const { state } = useLocation();
  const { toast } = useToast();
  const params = useParams();
  const createAppResponse = state as CreateAppResponse;
  const app = suggestedApps.find(x => x.id == params.id);

  if (!createAppResponse) {
    return <Navigate to="/apps/new" />;
  }

  const pairingUri = createAppResponse.pairingUri;

  const copy = () => {
    copyToClipboard(pairingUri);
    toast({ title: "Copied to clipboard." });
  };

  if (!app)
    return;

  return (
    <>
      <AppHeader
        title={`Connect to ${app.title}`}
        description="Configure wallet permissions for the app and follow instructions to finalise the connection." />

      <div className="flex flex-col gap-3 ph-no-capture">
        <div>
          <p>
            1. Open <span className="font-semibold">{app.title}</span> and go to "Wallet" —> "Attach Wallet"
          </p>
          <p>
            2. Scan or paste the connection secret
          </p>
        </div>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Connection Secret</CardTitle>
          </CardHeader>
          <CardContent className="text-center flex flex-col gap-3">
            <a
              href={pairingUri}
              target="_blank"
              className="relative"
            >
              <QRCode value={pairingUri} className="w-full" />
              <img src={app.logo}
                className="absolute w-12 h-12 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary p-1 rounded"
              />
            </a>
            <div>
              <Button onClick={copy} variant="outline">
                <CopyIcon className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
