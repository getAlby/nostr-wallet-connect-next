import { LucideIcon, ShieldAlert, Zap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import { useAlbyBalance } from "src/hooks/useAlbyBalance";
import { useChannels } from "src/hooks/useChannels";
import { useInfo } from "src/hooks/useInfo";
import useChannelOrderStore from "src/state/ChannelOrderStore";

function SidebarHint() {
  const { data: channels } = useChannels();
  const { data: balance } = useAlbyBalance();
  const { data: info } = useInfo();
  const { order } = useChannelOrderStore();
  const location = useLocation();

  // Don't distract with hints while opening a channel
  if (location.pathname.endsWith("/channels/order")) {
    return null;
  }

  // User has a channel order
  if (order) {
    return (
      <SidebarHintCard
        icon={Zap}
        title="New Channel"
        description="You're currently opening a new channel"
        buttonText="View Channel"
        buttonLink="/channels/order"
      />
    );
  }
  // User has no channels yet
  if (channels?.length === 0 && balance) {
    return (
      <SidebarHintCard
        icon={Zap}
        title="Open Your First Channel"
        description="Deposit bitcoin by onchain or lightning payment to start using your new wallet."
        buttonText="Begin Now"
        buttonLink="/channels/new"
      />
    );
  } else {
    // TODO: Show hint to migrate Alby balance to new wallet
    // if (balance && balance.sats > 0) {

    if (info?.showBackupReminder) {
      return (
        <SidebarHintCard
          icon={ShieldAlert}
          title="Backup Your Keys"
          description=" Not backing up your key might result in permanently losing
                access to your funds."
          buttonText="Backup Now"
          buttonLink="/settings/backup"
        />
      );
    }
  }
}

type SidebarHintCardProps = {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  icon: LucideIcon;
};
function SidebarHintCard({
  title,
  description,
  icon: Icon,
  buttonText,
  buttonLink,
}: SidebarHintCardProps) {
  return (
    <div className="md:m-4">
      <Card>
        <CardHeader className="p-4">
          <Icon className="h-8 w-8 mb-4" />
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Link to={buttonLink}>
            <Button size="sm" className="w-full">
              {buttonText}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default SidebarHint;
