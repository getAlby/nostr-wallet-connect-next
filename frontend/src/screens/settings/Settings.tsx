import { CircleCheck, Link2Off } from "lucide-react";
import SettingsHeader from "src/components/SettingsHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "src/components/ui/card";
import { LoadingButton } from "src/components/ui/loading-button";
import { useInfo } from "src/hooks/useInfo";

function Settings() {
  const { data: info } = useInfo();

  const connected = false;

  return (
    <>
      <SettingsHeader
        title="General"
        description="Adjust general settings of your Alby Hub"
      />
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Alby Account</CardTitle>
            <CardDescription>
              Link your lightning address & other apps to this hub.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">Status</div>
            {connected &&
              <div className="flex flex-row gap-2 items-center">
                <CircleCheck className="w-4 h-4" />
                <p className="font-medium">Linked</p>
              </div>
            }
            {!connected &&

              <div className="flex flex-row gap-2 items-center">
                <Link2Off className="w-4 h-4" />
                <p className="font-medium">Not Linked</p>
              </div>
            }
          </CardContent>
          {!connected &&
            <CardFooter>
              <LoadingButton>Link now</LoadingButton>
            </CardFooter>
          }
        </Card>
      </div>
    </>
  );
}

export default Settings;
