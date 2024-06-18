import dayjs from "dayjs";
import { Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "src/components/ui/button";
import { Progress } from "src/components/ui/progress";
import { App } from "src/types";

type AppCardConnectionInfoProps = {
  connection: App;
};

export function AppCardConnectionInfo({
  connection,
}: AppCardConnectionInfoProps) {
  return (
    <>
      {connection.maxAmount > 0 && (
        <>
          <div className="flex flex-row justify-between">
            <div className="mb-2">
              <p className="text-xs text-secondary-foreground font-medium">
                You've spent
              </p>
              <p className="text-xl font-medium">
                {new Intl.NumberFormat().format(connection.budgetUsage)} sats
              </p>
            </div>
            <div className="text-right">
              {" "}
              <p className="text-xs text-secondary-foreground font-medium">
                Left in budget
              </p>
              <p className="text-xl font-medium text-muted-foreground">
                {new Intl.NumberFormat().format(
                  connection.maxAmount - connection.budgetUsage
                )}{" "}
                sats
              </p>
            </div>
          </div>
          <Progress
            className="h-4"
            value={(connection.budgetUsage * 100) / connection.maxAmount}
          />
          <div className="flex flex-row justify-between text-xs items-center mt-2">
            {connection.maxAmount > 0 &&
            connection.budgetRenewal !== "never" ? (
              <>Renews {connection.budgetRenewal}</>
            ) : (
              <div /> // force edit button to right hand side
            )}
            <div className="justify-self-end">
              <Link to={`/apps/${connection.nostrPubkey}`}>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
          {connection.lastEventAt && (
            <div className="flex flex-row justify-between text-xs items-center">
              <div className="flex flex-row justify-between">
                <div>Last used:&nbsp;</div>
                <div>{dayjs(connection.lastEventAt).fromNow()}</div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
