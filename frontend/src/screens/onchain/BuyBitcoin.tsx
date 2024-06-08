import React from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "src/components/AppHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "src/components/ui/breadcrumb";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { LoadingButton } from "src/components/ui/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/components/ui/select";
import { MOONPAY_SUPPORTED_CURRENCIES, localStorageKeys } from "src/constants";
import { useCSRF } from "src/hooks/useCSRF";
import { AlbyTopupResponse, GetOnchainAddressResponse } from "src/types";
import { openLink } from "src/utils/openLink";
import { request } from "src/utils/request";

export default function BuyBitcoin() {
  const [currency, setCurrency] = React.useState("usd");
  const [amount, setAmount] = React.useState("250");
  const [loading, setLoading] = React.useState(false);
  const { data: csrf } = useCSRF();
  const [onchainAddress, setOnchainAddress] = React.useState<string>();
  const navigate = useNavigate();

  async function getMoonpayUrl() {
    if (!csrf) {
      throw new Error("csrf not loaded");
    }
    setLoading(true);
    try {
      const response = await request<AlbyTopupResponse>(`/api/alby/topup`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseInt(amount),
          address: onchainAddress,
          currency,
        }),
      });

      if (!response) {
        throw new Error("No provider url in response");
      }

      return response[0].url;
    } catch (error) {
      alert("Failed to request provider url: " + error);
    } finally {
      setLoading(false);
    }
  }

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
      console.error("Failed to request a new address: " + error);
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
            <BreadcrumbLink asChild>
              <Link to="/channels/onchain/deposit-bitcoin">
                Deposit Bitcoin
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Buy Bitcoin</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <AppHeader
        title="Buy Bitcoin"
        description="Use one of our partner providers to buy bitcoin and deposit it to your savings balance."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 lg:gap-10">
        <div className="flex max-w-lg flex-col gap-4">
          <div className="grid gap-4">
            <p className="text-muted-foreground">
              How much bitcoin you’d like add to your savings balance?
            </p>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <Select
                name="currency"
                value={currency}
                onValueChange={(value) => setCurrency(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {MOONPAY_SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="amount">Enter Amount</Label>
              <Input
                name="amount"
                autoFocus
                onChange={(e) => setAmount(e.target.value)}
                value={amount}
                type="text"
                placeholder="amount"
              />
            </div>

            <LoadingButton
              size="sm"
              loading={loading}
              onClick={async () => {
                const response: string | undefined = await getMoonpayUrl();

                if (response) {
                  openLink(response);
                  navigate("/channels");
                }
              }}
              type="button"
            >
              Next
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
}
