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
import { localStorageKeys } from "src/constants";
import { useCSRF } from "src/hooks/useCSRF";
import { cn } from "src/lib/utils";
import { GetOnchainAddressResponse } from "src/types";
import { request } from "src/utils/request";

export default function BuyBitcoin() {
  const steps = [{ id: "specifyOrder" }] satisfies StepItem[];

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("usd");
  const [amount, setAmount] = React.useState("250");
  const [loading, setLoading] = React.useState(false);
  const { data: csrf } = useCSRF();
  const [onchainAddress, setOnchainAddress] = React.useState<string>();

  async function apiRequest(
    endpoint: string,
    method: string,
    requestBody?: object
  ) {
    try {
      if (!csrf) {
        throw new Error("csrf not loaded");
      }

      const requestOptions: RequestInit = {
        method: method,
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
      };

      if (requestBody) {
        requestOptions.body = JSON.stringify(requestBody);
      }

      const data = await request(endpoint, requestOptions);

      return data;
    } catch (error) {
      console.error("failed to do api request", error);
    }
  }

  const currencies = [
    {
      value: "usd",
      label: "USD - American Dollar",
    },
    {
      value: "ars",
      label: "ARS - Argentine Peso",
    },
    {
      value: "aud",
      label: "AUD - Australian Dollar",
    },
    {
      value: "thb",
      label: "THB - Baht",
    },
    {
      value: "bbd",
      label: "BBD - Barbados Dollar",
    },
    {
      value: "bzd",
      label: "BZD - Belize Dollar",
    },
    {
      value: "bmd",
      label: "BMD - Bermudian Dollar",
    },
    {
      value: "brl",
      label: "BRL - Brazilian Real",
    },
    {
      value: "bnd",
      label: "BND - Brunei Dollar",
    },
    {
      value: "bgn",
      label: "BGN - Bulgarian Lev",
    },
    {
      value: "cad",
      label: "CAD - Canadian Dollar",
    },
    {
      value: "xaf",
      label: "XAF - CFA Franc BEAC",
    },
  ];

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
                          ? currencies.find(
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
                            {currencies.map((currency) => (
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
    const { nextStep, isLastStep } = useStepper();

    return (
      <div className="w-full flex mt-4 mb-4">
        {!props.blockNext && (
          <LoadingButton
            size="sm"
            loading={loading}
            onClick={async () => {
              if (isLastStep) {
                setLoading(true);
                const response = (await apiRequest(
                  `/api/alby/topup?&currency=${value}`,
                  "POST",
                  {
                    amount: parseInt(amount),
                    address: onchainAddress,
                  }
                )) as [{ name: string; url: string }];

                setLoading(false);
                window.open(response[0].url);
                nextStep();
              } else {
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
