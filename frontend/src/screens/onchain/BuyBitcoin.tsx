import { Check, ChevronsUpDown } from "lucide-react";
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
import { Button } from "src/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "src/components/ui/command";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { LoadingButton } from "src/components/ui/loading-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "src/components/ui/popover";
import { Step, StepItem, Stepper, useStepper } from "src/components/ui/stepper";
import { localStorageKeys, MOONPAY_SUPPORTED_CURRENCIES } from "src/constants";
import { useCSRF } from "src/hooks/useCSRF";
import { cn } from "src/lib/utils";
import { AlbyTopupResponse, GetOnchainAddressResponse } from "src/types";
import { request } from "src/utils/request";

export default function BuyBitcoin() {
  const steps = [{ id: "specifyOrder" }] satisfies StepItem[];

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("usd");
  const [amount, setAmount] = React.useState("250");
  const [loading, setLoading] = React.useState(false);
  const { data: csrf } = useCSRF();
  const [onchainAddress, setOnchainAddress] = React.useState<string>();

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
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {value
                          ? MOONPAY_SUPPORTED_CURRENCIES.find(
                              (currency) => currency.value === value
                            )?.label
                          : "Select Currency"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height]">
                      <Command>
                        <CommandInput placeholder="Search option..." />
                        <CommandEmpty>NO Currency Found</CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {MOONPAY_SUPPORTED_CURRENCIES.map((currency) => (
                              <CommandItem
                                key={currency.value}
                                value={currency.value}
                                onSelect={(currentValue: string) => {
                                  setValue(
                                    currentValue === value ? "" : currentValue
                                  );
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    value === currency.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {currency.label}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                window.open(response);
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
