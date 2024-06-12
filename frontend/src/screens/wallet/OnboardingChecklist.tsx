import { Circle, CircleCheck } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import { ALBY_MIN_BALANCE, ALBY_SERVICE_FEE } from "src/constants";
import { useAlbyBalance } from "src/hooks/useAlbyBalance";
import { useAlbyMe } from "src/hooks/useAlbyMe";
import { useApps } from "src/hooks/useApps";
import { useChannels } from "src/hooks/useChannels";
import { useInfo } from "src/hooks/useInfo";
import { useNodeConnectionInfo } from "src/hooks/useNodeConnectionInfo";
import { cn } from "src/lib/utils";

function OnboardingChecklist() {
  const { data: albyBalance } = useAlbyBalance();
  const { data: albyMe } = useAlbyMe();
  const { data: apps } = useApps();
  const { data: channels } = useChannels();
  const { data: info, hasChannelManagement, hasMnemonic } = useInfo();
  const { data: nodeConnectionInfo } = useNodeConnectionInfo();

  const hasAlbyBalance =
    hasChannelManagement &&
    albyBalance &&
    albyBalance.sats * (1 - ALBY_SERVICE_FEE) >
      ALBY_MIN_BALANCE + 50000; /* accomodate for onchain fees */
  const isLinked =
    albyMe &&
    nodeConnectionInfo &&
    albyMe?.keysend_pubkey === nodeConnectionInfo?.pubkey;
  const hasChannel = hasChannelManagement && channels && channels?.length > 0;
  const hasBackedUp =
    hasMnemonic &&
    info &&
    (!info.nextBackupReminder ||
      new Date(info.nextBackupReminder).getTime() > new Date().getTime());
  const hasCustomApp =
    apps && apps.find((x) => x.name !== "getalby.com") !== undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get started with your Alby Hub</CardTitle>
        <CardDescription>
          Follow these initial steps to set up and make the most of your Alby
          Hub.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ChecklistItem
          title="Open your first channel"
          description="Establish a new Lightning channel to enable fast and low-fee Bitcoin transactions."
          checked={hasChannel}
          to="/channels/new"
        />
        <ChecklistItem
          title="Link your Alby Account"
          description="Link your lightning address & other apps to this hub."
          checked={isLinked}
          to="/settings"
        />
        <ChecklistItem
          title="Migrate your balance to your Alby Hub"
          description="Move your existing funds into self-custody."
          checked={!hasAlbyBalance}
          to="/onboarding/lightning/migrate-alby"
        />
        <ChecklistItem
          title="Connect yor first app"
          description="Seamlessly connect apps and integrate your wallet with other apps from your hub."
          checked={hasCustomApp}
          to="/appstore"
        />
        <ChecklistItem
          title="Backup your keys"
          description="Secure your keys by creating a backup to ensure you don't lose access."
          checked={hasBackedUp}
          to="/settings/key-backup"
        />
        {/* <ChecklistItem
                    title="Make first payment"
                    description="description"
                    checked={false}
                /> */}
        {/* <ChecklistItem
                    title="Help a friend to get on lightning"
                    description="Invite friends and earn fee credits"
                    checked={false} to={""} /> */}
      </CardContent>
    </Card>
  );
}

function ChecklistItem({
  title,
  checked = false,
  description,
  to,
}: {
  title: string;
  checked?: boolean;
  description: string;
  to: string;
}) {
  const content = (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        {checked && <CircleCheck className="w-6 h-6" />}
        {!checked && <Circle className="w-6 h-6" />}
        <div
          className={cn(
            "text-sm font-medium leading-none",
            checked && "line-through"
          )}
        >
          {title}
        </div>
      </div>
      {!checked && (
        <div className="text-muted-foreground text-sm ml-8">{description}</div>
      )}
    </div>
  );

  return checked ? content : <Link to={to}>{content}</Link>;
}

export default OnboardingChecklist;
