import { Check, ChevronsUpDown, CreditCard } from "lucide-react";
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
  const steps = [
    { id: "specifyOrder" },
    { id: "finaliseOrder" },
  ] satisfies StepItem[];

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("usd");
  const [paymentMethod, setPaymentMethod] = React.useState("credit_debit_card");

  let urlWithSignature = "";

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
    } catch (error) {}
  }

  const currencies = [
    {
      value: "usd",
      label: "USD - American Dollar",
    },
    {
      value: "2",
      label: "ARS - Argentine Peso",
    },
    {
      value: "3",
      label: "AUD - Australian Dollar",
    },
    {
      value: "4",
      label: "THB - Baht",
    },
    {
      value: "5",
      label: "BBD - Barbados Dollar",
    },
    {
      value: "6",
      label: "BZD - Belize Dollar",
    },
    {
      value: "7",
      label: "BMD - Bermudian Dollar",
    },
    {
      value: "8",
      label: "BRL - Brazilian Real",
    },
    {
      value: "9",
      label: "BND - Brunei Dollar",
    },
    {
      value: "10",
      label: "BGN - Bulgarian Lev",
    },
    {
      value: "11",
      label: "CAD - Canadian Dollar",
    },
    {
      value: "12",
      label: "XAF - CFA Franc BEAC",
    },
  ];

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
      const originalUrl = `https://buy.moonpay.com/?apiKey=pk_live_vAllifniSt1auV36zH9bBFZMcrKQqkB&currencyCode=btc&baseCurrencyAmount=90&baseCurrencyCode=${value}&paymentMethod=${paymentMethod}&redirectURL=https%3A%2F%2Fportfolio.metamask.io%2Fbuy%2Forder-process%2Fmoonpay-b&walletAddress=${onchainAddress}`;
    } catch (error) {
      alert("Failed to request a new address: " + error);
    } finally {
    }
  }, [csrf]);

  React.useEffect(() => {
    const existingAddress = localStorage.getItem(
      localStorageKeys.onchainAddress
    );

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
                <div className="grid gap-2">
                  <p className="text-sm text-foreground font-bold">Currency</p>
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
                        <CommandEmpty>No framework found.</CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {currencies.map((currency) => (
                              <CommandItem
                                key={currency.value}
                                value={currency.value}
                                onSelect={(currentValue) => {
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

                <div className="grid gap-2">
                  <p className="text-sm text-foreground font-bold">
                    Payment Methods
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => setPaymentMethod("credit_debit_card")}
                      className={cn(
                        "cursor-pointer rounded border-2 text-center py-4 flex flex-col gap-2 items-center",
                        paymentMethod == "credit_debit_card"
                          ? "border-foreground"
                          : "border-muted"
                      )}
                    >
                      <CreditCard className="h-4 w-4" />
                      <p className="text-sm text-foreground">
                        Credit/debit card
                      </p>
                    </div>
                    <div
                      onClick={() => setPaymentMethod("ach_bank_transfer")}
                      className={cn(
                        "cursor-pointer rounded border-2 text-center py-4 flex flex-col gap-2 items-center",
                        paymentMethod == "ach_bank_transfer"
                          ? "border-foreground"
                          : "border-muted"
                      )}
                    >
                      <CreditCard className="h-4 w-4" />
                      <p className="text-sm text-foreground">Wire Transfer</p>
                    </div>
                  </div>
                </div>
              </div>
              <StepButtons />
            </Step>
            <Step id="finaliseOrder" key="finaliseOrder" label="Finalise Order">
              <StepButtons></StepButtons>
            </Step>
          </Stepper>
        </div>
      </div>
    </div>
  );
  function StepButtons(props: StepButtonProps) {
    const { nextStep, prevStep, isLastStep, isOptionalStep, isDisabledStep } =
      useStepper();

    console.log(isLastStep);
    return (
      <div className="w-full flex mt-4 mb-4">
        {!props.blockNext && (
          <Button
            size="sm"
            onClick={() =>
              isLastStep
                ? window.open(
                    `https://buy.moonpay.com/?apiKey=pk_live_vAllifniSt1auV36zH9bBFZMcrKQqkB&currencyCode=btc&baseCurrencyAmount=90&baseCurrencyCode=${value}&paymentMethod=${paymentMethod}&redirectURL=https%3A%2F%2Fportfolio.metamask.io%2Fbuy%2Forder-process%2Fmoonpay-b&walletAddress=${onchainAddress}&signature=${encodeURIComponent(
                      "NyTHEgO3aQ712o6XKgyvnc8AmilUj6Y8o58aZDgE3bM="
                    )}`
                  )
                : nextStep()
            }
            type="button"
          >
            Next
          </Button>
        )}
      </div>
    );
  }
}

type StepButtonProps = {
  blockNext?: boolean;
};
