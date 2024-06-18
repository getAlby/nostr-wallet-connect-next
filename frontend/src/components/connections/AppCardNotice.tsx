import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { Button } from "src/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "src/components/ui/tooltip";
import { App } from "src/types";

type AppCardNoticeProps = {
  app: App;
};

const ONE_WEEK_IN_SECONDS = 8 * 24 * 60 * 60 * 1000;

export function AppCardNotice({ app }: AppCardNoticeProps) {
  return (
    <div className="absolute top-0 right-0">
      {app.expiresAt ? (
        new Date(app.expiresAt).getTime() < new Date().getTime() ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={`/apps/${app.nostrPubkey}`}>
                  <Button variant="destructive">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    &nbsp; Expired
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                Expired {dayjs(app.expiresAt).fromNow()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : new Date(app.expiresAt).getTime() - ONE_WEEK_IN_SECONDS <
          new Date().getTime() ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={`/apps/${app.nostrPubkey}`}>
                  <Button variant="outline">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    &nbsp; Expires Soon
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                Expires {dayjs(app.expiresAt).fromNow()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null
      ) : null}
    </div>
  );
}
