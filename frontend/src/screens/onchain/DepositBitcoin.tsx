import { Copy, CreditCard, RefreshCw } from "lucide-react";
import React from "react";
import QRCode from "react-qr-code";
import { Link } from "react-router-dom";
import AppHeader from "src/components/AppHeader";
import Loading from "src/components/Loading";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "src/components/ui/breadcrumb";
import { Button } from "src/components/ui/button";
import { Card, CardContent } from "src/components/ui/card";
import { toast } from "src/components/ui/use-toast";
import { localStorageKeys } from "src/constants";
import { useCSRF } from "src/hooks/useCSRF";
import { copyToClipboard } from "src/lib/clipboard";
import { GetOnchainAddressResponse } from "src/types";
import { request } from "src/utils/request";

export default function DepositBitcoin() {
  const { data: csrf } = useCSRF();
  const [onchainAddress, setOnchainAddress] = React.useState<string>();

  const getNewAddress = React.useCallback(async () => {
    if (!csrf) {
      return;
    }

    try {
      const response = await request<GetOnchainAddressResponse>(
        "/api/wallet/new-address",
        {
          method: "POST",
          headers: {
            "X-CSRF-Token": csrf,
            "Content-Type": "application/json",
          },
          //body: JSON.stringify({}),
        }
      );
      if (!response?.address) {
        throw new Error("No address in response");
      }
      localStorage.setItem(localStorageKeys.onchainAddress, response.address);
      setOnchainAddress(response.address);
    } catch (error) {
      alert("Failed to request a new address: " + error);
    } finally {
    }
  }, [csrf]);

  React.useEffect(() => {
    const existingAddress = localStorage.getItem(
      localStorageKeys.onchainAddress
    );
    if (existingAddress) {
      setOnchainAddress(existingAddress);
      return;
    }
    getNewAddress();
  }, [getNewAddress]);

  if (!onchainAddress) {
    return (
      <div className="flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/channels">Liquidity</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Deposit Bitcoin</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <AppHeader
        title="Deposit Bitcoin to Savings Balance"
        description="Deposit bitcoin to on-chain address below to add it to your savings balance, which you can use to open new lightning channels."
        contentRight={
          <Link to="/apps/new">
            <Button>
              <CreditCard className="h-4 w-4 mr-2" />
              Buy Bitcoin
            </Button>
          </Link>
        }
      />
      <div className="w-80">
        <Card>
          <CardContent className="grid gap-6 p-8 justify-center border border-muted">
            <a
              href={`bitcoin:${onchainAddress}`}
              target="_blank"
              className="flex justify-center"
            >
              <QRCode value={onchainAddress} />
            </a>

            <div className="text-center">
              {onchainAddress.match(/.{1,4}/g)?.map((word, index) => {
                if (index % 2 === 0) {
                  return <span className="text-foreground">{word} </span>;
                } else {
                  return <span className="text-muted-foreground">{word} </span>;
                }
              })}
            </div>

            <div className="flex flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={getNewAddress}
                className="w-28"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Change
              </Button>
              <Button
                variant="secondary"
                className="w-28"
                onClick={() => {
                  copyToClipboard(onchainAddress);
                  toast({ title: "Copied to clipboard." });
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
