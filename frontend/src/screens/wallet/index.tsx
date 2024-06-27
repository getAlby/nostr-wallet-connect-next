import {
  ArrowDownIcon,
  ArrowUp,
  ArrowUpIcon,
  Bitcoin,
  ExternalLinkIcon,
  ScanIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import AlbyHead from "src/assets/images/alby-head.svg";
import AppHeader from "src/components/AppHeader";
import BreezRedeem from "src/components/BreezRedeem";
import ExternalLink from "src/components/ExternalLink";
import Loading from "src/components/Loading";
import TransactionsList from "src/components/TransactionsList";
import { Button } from "src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import { useBalances } from "src/hooks/useBalances";
import { useInfo } from "src/hooks/useInfo";
import OnboardingChecklist from "src/screens/wallet/OnboardingChecklist";

function Wallet() {
  const { data: info } = useInfo();
  const { data: balances } = useBalances();

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const extensionInstalled = (window as any).alby !== undefined;

  if (!info || !balances) {
    return <Loading />;
  }

  return (
    <>
      <AppHeader title="Wallet" description="Send and receive transactions" />
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5">
        <div className="text-5xl font-semibold">
          {new Intl.NumberFormat().format(
            Math.floor(balances.lightning.totalSpendable / 1000)
          )}{" "}
          sats
        </div>
        <div className="flex items-center gap-4">
          <Link to="/wallet/scan">
            <Button variant="secondary">
              <ScanIcon className="h-4 w-4 mr-2" />
              Scan
            </Button>
          </Link>
          <Link to="/wallet/receive">
            <Button>
              <ArrowDownIcon className="h-4 w-4 mr-2" />
              Receive
            </Button>
          </Link>
          <Link to="/wallet/send">
            <Button>
              <ArrowUpIcon className="h-4 w-4 mr-2" />
              Send
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Spending Balance
            </CardTitle>
            <ArrowUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!balances && (
              <div>
                <div className="animate-pulse d-inline ">
                  <div className="h-2.5 bg-primary rounded-full w-12 my-2"></div>
                </div>
              </div>
            )}
            {balances && (
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat(undefined, {}).format(
                  Math.floor(balances.lightning.totalSpendable / 1000)
                )}{" "}
                sats
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Savings Balance
            </CardTitle>
            <Bitcoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!balances && (
              <div>
                <div className="animate-pulse d-inline ">
                  <div className="h-2.5 bg-primary rounded-full w-12 my-2"></div>
                </div>
              </div>
            )}
            <div className="text-2xl font-bold">
              {balances && (
                <>
                  {new Intl.NumberFormat().format(balances.onchain.spendable)}{" "}
                  sats
                  {balances &&
                    balances.onchain.spendable !== balances.onchain.total && (
                      <p className="text-xs text-muted-foreground animate-pulse">
                        +
                        {new Intl.NumberFormat().format(
                          balances.onchain.total - balances.onchain.spendable
                        )}{" "}
                        sats incoming
                      </p>
                    )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ExternalLink to="https://www.getalby.com/dashboard">
          <Card>
            <CardHeader>
              <div className="flex flex-row items-center">
                <img
                  src={AlbyHead}
                  className="w-12 h-12 rounded-xl p-1 border"
                />
                <div>
                  <CardTitle>
                    <div className="flex-1 leading-5 font-semibold text-xl whitespace-nowrap text-ellipsis overflow-hidden ml-4">
                      Alby Web
                    </div>
                  </CardTitle>
                  <CardDescription className="ml-4">
                    Install Alby Web on your phone and use your Hub on the go.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-right">
              <Button variant="outline">
                Open Alby Web
                <ExternalLinkIcon className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </ExternalLink>
        {!extensionInstalled && (
          <ExternalLink to="https://www.getalby.com">
            <Card>
              <CardHeader>
                <div className="flex flex-row items-center">
                  <img
                    src={AlbyHead}
                    className="w-12 h-12 rounded-xl p-1 border bg-[#FFDF6F]"
                  />
                  <div>
                    <CardTitle>
                      <div className="flex-1 leading-5 font-semibold text-xl whitespace-nowrap text-ellipsis overflow-hidden ml-4">
                        Alby Browser Extension
                      </div>
                    </CardTitle>
                    <CardDescription className="ml-4">
                      Seamless bitcoin payments in your favourite internet
                      browser.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-right">
                <Button variant="outline">
                  Install Alby Extension
                  <ExternalLinkIcon className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </ExternalLink>
        )}
      </div>

      <OnboardingChecklist />

      <BreezRedeem />

      <TransactionsList />
    </>
  );
}

export default Wallet;
