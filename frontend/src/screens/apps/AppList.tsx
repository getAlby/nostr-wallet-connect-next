import { Cable, CheckCircle2, CirclePlus, CircleX, ExternalLinkIcon, Link2Icon, ZapIcon } from "lucide-react";
import { Link } from "react-router-dom";
import AppCard from "src/components/AppCard";
import AppHeader from "src/components/AppHeader";
import EmptyState from "src/components/EmptyState";
import ExternalLink from "src/components/ExternalLink";
import Loading from "src/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "src/components/ui/avatar";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "src/components/ui/card";
import { LoadingButton } from "src/components/ui/loading-button";
import { Progress } from "src/components/ui/progress";
import { Separator } from "src/components/ui/separator";
import { useAlbyMe } from "src/hooks/useAlbyMe";
import { useApps } from "src/hooks/useApps";
import { useInfo } from "src/hooks/useInfo";
import { LinkStatus, useLinkAccount } from "src/hooks/useLinkAccount";

function AppList() {
  const { data: apps } = useApps();
  const { data: info } = useInfo();
  const { data: albyMe } = useAlbyMe();
  const { loading, linkStatus, linkAccount } = useLinkAccount();

  if (!apps || !info) {
    return <Loading />;
  }

  const otherApps = apps.filter(x => x.name !== "getalby.com");
  const albyConnection = apps.find(x => x.name === "getalby.com");

  return (
    <>
      <AppHeader
        title="Connections"
        description="Apps that you connected to already"
        contentRight={
          <Link to="/apps/new">
            <Button>
              <CirclePlus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </Link>
        }
      />

      {!otherApps.length && (
        <EmptyState
          icon={Cable}
          title="Connect Your First App"
          description="Connect your app of choice, fine-tune permissions and enjoy a seamless and secure wallet experience."
          buttonText="See Recommended Apps"
          buttonLink="/appstore"
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Alby Account
          </CardTitle>
          <CardDescription>
            Link Your Alby Account to use your lightning address with Alby Hub and use apps that you connected to your Alby Account.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-2 mt-5 gap-3">
            <div className="flex flex-col gap-4">
              <div className="flex flex-row gap-4 ">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={albyMe?.avatar} alt="@satoshi" />
                  <AvatarFallback>SN</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="text-xl font-semibold">
                    {albyMe?.name}
                  </div>
                  <div className="flex flex-row items-center gap-1">
                    <ZapIcon className="w-4 h-4" />
                    {albyMe?.lightning_address}
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-3 items-center">
                {linkStatus === LinkStatus.SharedNode ?
                  <LoadingButton onClick={linkAccount} loading={loading}>
                    <Link2Icon className="w-4 h-4 mr-2" />
                    Link your Alby Account
                  </LoadingButton>
                  : linkStatus === LinkStatus.ThisNode ?
                    <Button variant="positive" disabled className="disabled:opacity-100">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Alby Account Linked
                    </Button> :
                    <Button variant="destructive" disabled>
                      <CircleX className="w-4 h-4 mr-2" />
                      Linked to another wallet
                    </Button>
                }
                <ExternalLink to="https://www.getalby.com/node">
                  <Button variant="outline">
                    <ExternalLinkIcon className="w-4 h-4 mr-2" />
                    Alby Account Settings
                  </Button>
                </ExternalLink>
              </div>
            </div>
            <div>
              {albyConnection && <>
                {albyConnection.maxAmount > 0 &&
                  <>
                    <div className="flex flex-row justify-between">
                      <div className="mb-2">
                        <p className="text-xs text-secondary-foreground font-medium">
                          You've spent
                        </p>
                        <p className="text-xl font-medium">
                          {new Intl.NumberFormat().format(albyConnection.budgetUsage)} sats
                        </p>
                      </div>
                      <div className="text-right">
                        {" "}
                        <p className="text-xs text-secondary-foreground font-medium">
                          Left in budget
                        </p>
                        <p className="text-xl font-medium text-muted-foreground">
                          {new Intl.NumberFormat().format(
                            albyConnection.maxAmount - albyConnection.budgetUsage
                          )}{" "}
                          sats
                        </p>
                      </div>
                    </div>
                    <Progress
                      className="h-4"
                      value={(albyConnection.budgetUsage * 100) / albyConnection.maxAmount}
                    />
                    {albyConnection.maxAmount > 0 ? (
                      <div className="text-xs mt-2">
                        {new Intl.NumberFormat().format(albyConnection.maxAmount)} sats /{" "}
                        {albyConnection.budgetRenewal}
                      </div>
                    ) : (
                      "Not set"
                    )}
                  </>
                }
              </>}
            </div>
          </div>

        </CardContent>
      </Card>

      {otherApps.length > 0 && (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app, index) => (
            <AppCard key={index} app={app} />
          ))}
        </div>
      )
      }
    </>
  );
}

export default AppList;
