import { ArrowDownUpIcon, MoveDownIcon, SquarePenIcon } from "lucide-react";
import React from "react";
import { Checkbox } from "src/components/ui/checkbox";
import { Label } from "src/components/ui/label";
import { cn } from "src/lib/utils";
import {
  NIP_47_MAKE_INVOICE_METHOD,
  NIP_47_PAY_INVOICE_METHOD,
  ScopeGroupType,
  ScopeType,
  nip47ScopeDescriptions,
} from "src/types";

interface ScopesProps {
  scopes: Set<ScopeType>;
  onScopeChange: (scopes: Set<ScopeType>) => void;
}

// TODO: this runs everytime
const scopeGrouper = (scopes: Set<ScopeType>) => {
  if (
    scopes.size === 2 &&
    scopes.has(NIP_47_MAKE_INVOICE_METHOD) &&
    scopes.has(NIP_47_PAY_INVOICE_METHOD)
  ) {
    return "send_receive";
  } else if (scopes.size === 1 && scopes.has(NIP_47_MAKE_INVOICE_METHOD)) {
    return "only_receive";
  }
  return "custom";
};

const Scopes: React.FC<ScopesProps> = ({ scopes, onScopeChange }) => {
  const [scopeGroup, setScopeGroup] = React.useState(scopeGrouper(scopes));

  const handleScopeGroupChange = (scopeGroup: ScopeGroupType) => {
    setScopeGroup(scopeGroup);
    switch (scopeGroup) {
      case "send_receive":
        onScopeChange(
          new Set([NIP_47_PAY_INVOICE_METHOD, NIP_47_MAKE_INVOICE_METHOD])
        );
        break;
      case "only_receive":
        onScopeChange(new Set([NIP_47_MAKE_INVOICE_METHOD]));
        break;
      default: {
        onScopeChange(
          new Set(Object.keys(nip47ScopeDescriptions) as ScopeType[])
        );
        break;
      }
    }
  };

  const handleScopeChange = (scope: ScopeType) => {
    const newScopes = new Set(scopes);
    if (newScopes.has(scope)) {
      newScopes.delete(scope);
    } else {
      newScopes.add(scope);
    }
    onScopeChange(newScopes);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col w-full">
        <p className="font-medium text-sm mb-2">Choose wallet permissions</p>
        <div className="flex gap-4">
          <div
            className={`flex flex-col items-center border-2 rounded cursor-pointer ${scopeGroup === "send_receive" ? "border-primary" : "border-muted"} p-4`}
            onClick={() => {
              handleScopeGroupChange("send_receive");
            }}
          >
            <ArrowDownUpIcon className="mb-2" />
            <p className="text-sm font-medium">Send & Receive</p>
            <p className="text-[10px] text-muted-foreground text-nowrap">
              Pay and create invoices
            </p>
          </div>
          <div
            className={`flex flex-col items-center border-2 rounded cursor-pointer ${scopeGroup === "only_receive" ? "border-primary" : "border-muted"}  p-4`}
            onClick={() => {
              handleScopeGroupChange("only_receive");
            }}
          >
            <MoveDownIcon className="mb-2" />
            <p className="text-sm font-medium">Just Receive</p>
            <p className="text-[10px] text-muted-foreground text-nowrap">
              Only create invoices
            </p>
          </div>
          <div
            className={`flex flex-col items-center border-2 rounded cursor-pointer ${scopeGroup === "custom" ? "border-primary" : "border-muted"} p-4`}
            onClick={() => {
              handleScopeGroupChange("custom");
            }}
          >
            <SquarePenIcon className="mb-2" />
            <p className="text-sm font-medium">Custom</p>
            <p className="text-[10px] text-muted-foreground text-nowrap">
              Define permissions
            </p>
          </div>
        </div>
      </div>

      {scopeGroup == "custom" && (
        <>
          <p className="font-medium text-sm mt-6">Authorize the app to:</p>
          <ul className="flex flex-col w-full mt-3">
            {(Object.keys(nip47ScopeDescriptions) as ScopeType[]).map(
              (rm, index) => {
                return (
                  <li
                    key={index}
                    className={cn(
                      "w-full",
                      rm == "pay_invoice" ? "order-last" : ""
                    )}
                  >
                    <div className="flex items-center mb-2">
                      <Checkbox
                        id={rm}
                        className="mr-2"
                        onCheckedChange={() => handleScopeChange(rm)}
                        checked={scopes.has(rm)}
                      />
                      <Label htmlFor={rm} className="cursor-pointer">
                        {nip47ScopeDescriptions[rm]}
                      </Label>
                    </div>
                  </li>
                );
              }
            )}
          </ul>
        </>
      )}
    </div>
  );
};

export default Scopes;
