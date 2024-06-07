import React from "react";
import { Link } from "react-router-dom";
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
import { Step, StepItem, Stepper, useStepper } from "src/components/ui/stepper";
import { localStorageKeys, MOONPAY_SUPPORTED_CURRENCIES } from "src/constants";
import { useCSRF } from "src/hooks/useCSRF";
import { AlbyTopupResponse, GetOnchainAddressResponse } from "src/types";
import { request } from "src/utils/request";

export default function BuyBitcoin() {
  const steps = [{ id: "specifyOrder" }] satisfies StepItem[];

  const [providerUrl, setProviderUrl] = React.useState("");
  const [value, setValue] = React.useState("usd");
  const [amount, setAmount] = React.useState("250");
  const [loading, setLoading] = React.useState(false);
  const { data: csrf } = useCSRF();
  const [onchainAddress, setOnchainAddress] = React.useState<string>();
  const isHttpsMode = window.location.protocol.startsWith("https");

  async function getMoonpayUrl() {
    if (!csrf) {
      throw new Error("csrf not loaded");
    }
    setLoading(true);
    try {
      const response = await request<AlbyTopupResponse>(
        `/api/alby/topup?&currency=${value}`,
        {
          method: "POST",
          headers: {
            "X-CSRF-Token": csrf,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseInt(amount),
            address: onchainAddress,
          }),
        }
      );

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
          <Stepper initialStep={0} steps={steps} orientation="vertical">
            <Step id="specifyOrder" key="specifyOrder" label="Specify Order">
              <div className="grid gap-4">
                <p className="text-muted-foreground">
                  How much bitcoin you’d like add to your savings balance?
                </p>
                <div className="grid gap-2 p-2">
                  <Label>Currency</Label>
                  <Select
                    name="currency"
                    value={value}
                    onValueChange={(value) => setValue(value)}
                  >
                    <SelectTrigger className="mb-5">
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

                <div className="grid gap-1.5 p-2">
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
              </div>

              <StepButtons />
            </Step>
          </Stepper>
        </div>
      </div>

      {providerUrl && isHttpsMode && (
        <div className="mx-auto justify-center">
          <iframe
            allow="accelerometer; autoplay; camera; gyroscope; payment"
            src={providerUrl}
            height="720"
            className="w-full sm:w-[500px] outline-0 rounded-md shadow mx-auto"
          >
            <p>Your browser does not support iframes.</p>
          </iframe>
        </div>
      )}
    </div>
  );
  function StepButtons(props: StepButtonProps) {
    const { nextStep } = useStepper();
    return (
      <div className="w-full flex mt-4 mb-4">
        {!props.blockNext && (
          <LoadingButton
            size="sm"
            loading={loading}
            onClick={async () => {
              const response: string | undefined = await getMoonpayUrl();

              if (response) {
                setProviderUrl(response);

                if (!isHttpsMode) {
                  window.open(response);
                }
                nextStep();
              }
            }}
            type="button"
          >
            Next
          </LoadingButton>
        )}
      </div>
    );
  }
}

type StepButtonProps = {
  blockNext?: boolean;
};
