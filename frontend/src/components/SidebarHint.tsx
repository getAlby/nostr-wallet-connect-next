import { LucideIcon, ShieldAlert, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "src/components/ui/card";
import { MIN_0CONF_BALANCE } from "src/constants";
import { useAlbyBalance } from "src/hooks/useAlbyBalance";
import { useChannels } from "src/hooks/useChannels";
import { useInfo } from "src/hooks/useInfo";

function SidebarHint() {
    const { data: channels } = useChannels();
    const { data: balance } = useAlbyBalance();
    const { data: info } = useInfo();

    // User has no channels yet
    if (channels?.length === 0 && balance) {
        // Default flow
        if (balance.sats < MIN_0CONF_BALANCE) {
            return <SidebarHintCard
                icon={Zap}
                title="Open Your First Channel"
                description="Deposit bitcoin by onchain or lightning payment to start using your new wallet."
                buttonText="Begin Now"
                buttonLink="/channels/new"
            />;
        }
        else {
            return <SidebarHintCard
                icon={Zap}
                title="Open Your First Channel"
                description="Deposit bitcoin by onchain or lightning payment to start using your new wallet."
                buttonText="Begin Now"
                buttonLink="/channels/new"
            />;
        }
    } else {
        // TODO: Show hint to migrate Alby balance to new wallet
        // if (balance && balance.sats > 0) {

        if (info?.showBackupReminder) {
            return <SidebarHintCard
                icon={ShieldAlert}
                title="Backup Your Keys"
                description=" Not backing up your key might result in permanently losing
                access to your funds."
                buttonText="Backup Now"
                buttonLink="/settings/backup"
            />;
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
function SidebarHintCard({ title, description, icon: Icon, buttonText, buttonLink }: SidebarHintCardProps) {
    return (
        <div className="p-4">
            <Card>
                <CardHeader className="p-2 pt-0 md:p-4">
                    <Icon className="h-8 w-8 mb-4" />
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                        {description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                    <Link to={buttonLink}>
                        <Button size="sm" className="w-full">
                            {buttonText}
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>);
}

export default SidebarHint;
