import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useCSRF } from "src/hooks/useCSRF";
import {
  BudgetRenewalType,
  CreateAppResponse,
  NIP_47_MAKE_INVOICE_METHOD,
  NIP_47_PAY_INVOICE_METHOD,
  ScopeType,
  budgetOptions,
  expiryOptions,
  validBudgetRenewals,
} from "src/types";

import { PlusCircle, XIcon } from "lucide-react";
import AppHeader from "src/components/AppHeader";
import Scopes from "src/components/Scopes";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/components/ui/select";
import { Separator } from "src/components/ui/separator";
import { useToast } from "src/components/ui/use-toast";
import { cn } from "src/lib/utils";
import { handleRequestError } from "src/utils/handleRequestError";
import { request } from "src/utils/request"; // build the project for this to appear
import { suggestedApps } from "../../components/SuggestedAppData";

const NewApp = () => {
  const location = useLocation();
  const { data: csrf } = useCSRF();
  const { toast } = useToast();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);

  const appId = queryParams.get("app") ?? "";
  const app = suggestedApps.find((app) => app.id === appId);

  const nameParam = app
    ? app.title
    : (queryParams.get("name") || queryParams.get("c")) ?? "";

  const pubkey = queryParams.get("pubkey") ?? "";
  const returnTo = queryParams.get("return_to") ?? "";

  const scopesParam =
    (queryParams.get("request_methods") || queryParams.get("scopes")) ?? "";
  const budgetRenewalParam = queryParams.get(
    "budget_renewal"
  ) as BudgetRenewalType;
  const budgetAmountParam = queryParams.get("max_amount") ?? "";
  const expiresAtParam = queryParams.get("expires_at") ?? "";

  const parseScopes = (scopeString: string): Set<ScopeType> => {
    const scopes = scopeString
      ? scopeString.split(" ")
      : [NIP_47_MAKE_INVOICE_METHOD, NIP_47_PAY_INVOICE_METHOD];

    // Create a Set of ScopeType from the array
    const scopeSet = new Set<ScopeType>(scopes as ScopeType[]);

    return scopeSet;
  };

  const parseExpiry = (expiresParam: string): Date | undefined => {
    const expiresParamTimestamp = parseInt(expiresParam);
    if (!isNaN(expiresParamTimestamp)) {
      return new Date(expiresParamTimestamp * 1000);
    }
    return undefined;
  };

  const [appName, setAppName] = useState(nameParam);
  const [scopes, setScopes] = useState(parseScopes(scopesParam));
  const [maxAmount, setMaxAmount] = useState(budgetAmountParam || "100000");
  const [budgetRenewal, setBudgetRenewal] = useState(
    validBudgetRenewals.includes(budgetRenewalParam)
      ? budgetRenewalParam
      : "monthly"
  );
  const [expiresAt, setExpiresAt] = useState(parseExpiry(expiresAtParam));
  const [customBudget, setCustomBudget] = useState(!!budgetAmountParam);

  // TODO: set expiry when set to non expiryType value like 24 days for example
  const [days, setDays] = useState(0);

  const [budgetOption, setBudgetOption] = useState(!!budgetAmountParam);
  const [expireOption, setExpireOption] = useState(!!expiresAtParam);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!csrf) {
      throw new Error("No CSRF token");
    }

    try {
      const createAppResponse = await request<CreateAppResponse>("/api/apps", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: appName,
          pubkey,
          budgetRenewal,
          maxAmount: parseInt(maxAmount),
          requestMethods: [...scopes].join(" "),
          expiresAt: expiresAt?.toISOString(),
          returnTo: returnTo,
        }),
      });

      if (!createAppResponse) {
        throw new Error("no create app response received");
      }

      if (createAppResponse.returnTo) {
        // open connection URI directly in an app
        window.location.href = createAppResponse.returnTo;
        return;
      }
      navigate(`/apps/created${app ? `?app=${app.id}` : ""}`, {
        state: createAppResponse,
      });
      toast({ title: "App created" });
    } catch (error) {
      handleRequestError(toast, "Failed to create app", error);
    }
  };

  const handleDaysChange = (days: number) => {
    setDays(days);
    if (!days) {
      setExpiresAt(undefined);
      return;
    }
    const currentDate = new Date();
    const expiryDate = new Date(
      Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate() + days,
        23,
        59,
        59,
        0
      )
    );
    setExpiresAt(expiryDate);
  };

  return (
    <>
      <AppHeader
        title={nameParam ? `Connect to ${appName}` : "Connect a new app"}
        description="Configure wallet permissions for the app and follow instructions to finalise the connection"
      />
      <form
        onSubmit={handleSubmit}
        acceptCharset="UTF-8"
        className="flex flex-col items-start max-w-lg"
      >
        {app && (
          <div className="flex flex-row items-center gap-3">
            <img src={app.logo} className="h-12 w-12" />
            <h2 className="font-semibold text-lg">{app.title}</h2>
          </div>
        )}
        {!nameParam && (
          <div className="w-full grid gap-1.5 mb-6">
            <Label htmlFor="name">Name</Label>
            <Input
              autoFocus
              type="text"
              name="name"
              value={appName}
              id="name"
              onChange={(e) => setAppName(e.target.value)}
              required
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Name of the app or purpose of the connection
            </p>
          </div>
        )}

        <Scopes scopes={scopes} onScopeChange={setScopes} />

        {scopes.has(NIP_47_PAY_INVOICE_METHOD) && (
          <>
            {!budgetOption && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setBudgetOption(true)}
                className="mb-4"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Set budget renewal
              </Button>
            )}
            {budgetOption && (
              <>
                <p className="font-medium text-sm mb-2">Budget Renewal</p>
                <div className="flex gap-2 items-center text-muted-foreground mb-4 text-sm capitalize">
                  <Select
                    value={budgetRenewal}
                    onValueChange={(value) =>
                      setBudgetRenewal(value as BudgetRenewalType)
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder={budgetRenewal} />
                    </SelectTrigger>
                    <SelectContent>
                      {validBudgetRenewals.map((renewalOption) => (
                        <SelectItem
                          key={renewalOption || "never"}
                          value={renewalOption || "never"}
                        >
                          {renewalOption
                            ? renewalOption.charAt(0).toUpperCase() +
                              renewalOption.slice(1)
                            : "Never"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                    <XIcon
                      className="cursor-pointer w-4 text-muted-foreground"
                      onClick={() => setBudgetRenewal("never")}
                    />
                  </Select>
                </div>
                <div className="grid grid-cols-5 grid-rows-2 md:grid-rows-1 md:grid-cols-5 gap-2 text-xs mb-4">
                  {Object.keys(budgetOptions).map((budget) => {
                    return (
                      // replace with something else and then remove dark prefixes
                      <div
                        key={budget}
                        onClick={() => {
                          setCustomBudget(false);
                          setMaxAmount(budgetOptions[budget].toString());
                        }}
                        className={`col-span-2 md:col-span-1 cursor-pointer rounded text-nowrap border-2 ${
                          !customBudget &&
                          parseInt(maxAmount) == budgetOptions[budget]
                            ? "border-primary"
                            : "border-muted"
                        } text-center p-4 dark:text-white`}
                      >
                        {`${budget} ${budgetOptions[budget] ? " sats" : ""}`}
                      </div>
                    );
                  })}
                  <div
                    onClick={() => {
                      setCustomBudget(true);
                      setMaxAmount("");
                    }}
                    className={`col-span-2 md:col-span-1 cursor-pointer rounded border-2 ${
                      customBudget ? "border-primary" : "border-muted"
                    } text-center p-4 dark:text-white`}
                  >
                    Custom...
                  </div>
                </div>
                {customBudget && (
                  <div className="w-full mb-6">
                    <Label htmlFor="budget" className="block mb-2">
                      Custom budget amount (sats)
                    </Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      required
                      min={1}
                      value={maxAmount}
                      onChange={(e) => {
                        setMaxAmount(e.target.value.trim());
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!expireOption && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setExpireOption(true)}
            className="mb-6"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Set expiration time
          </Button>
        )}

        {expireOption && (
          <div className="mb-6">
            <p className="font-medium text-sm mb-2">Connection expiration</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {Object.keys(expiryOptions).map((expiry) => {
                return (
                  <div
                    key={expiry}
                    onClick={() => handleDaysChange(expiryOptions[expiry])}
                    className={cn(
                      "cursor-pointer rounded border-2 text-center p-4",
                      days == expiryOptions[expiry]
                        ? "border-primary"
                        : "border-muted"
                    )}
                  >
                    {expiry}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* <div className="flex gap-4 mt-4">
          {scopes.has(NIP_47_PAY_INVOICE_METHOD) && !budgetOption && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setBudgetOption(true)}
              className="mb-4"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Set Budget Renewal
            </Button>
          )}
          {!expireOption && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setExpireOption(true)}
              className="mb-6"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Set expiration time
            </Button>
          )}
        </div> */}

        <Separator className="mb-6" />
        {returnTo && (
          <p className="text-xs text-muted-foreground">
            You will automatically return to {returnTo}
          </p>
        )}

        <Button type="submit">{pubkey ? "Connect" : "Next"}</Button>
      </form>
    </>
  );
};

export default NewApp;
