import React from "react";
import AppHeader from "src/components/AppHeader";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { LoadingButton } from "src/components/ui/loading-button";
import { useToast } from "src/components/ui/use-toast";
import { useCSRF } from "src/hooks/useCSRF";
import { PayInvoiceResponse } from "src/types";
import { request } from "src/utils/request";

export default function Send() {
  const { data: csrf } = useCSRF();
  const { toast } = useToast();
  const [isLoading, setLoading] = React.useState(false);
  const [invoice, setInvoice] = React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!csrf) {
      throw new Error("csrf not loaded");
    }
    try {
      setLoading(true);
      const payInvoiceResponse = await request<PayInvoiceResponse>(
        "/api/wallet/send",
        {
          method: "POST",
          headers: {
            "X-CSRF-Token": csrf,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invoice: invoice.trim() }),
        }
      );
      // setSignatureMessage(message);
      // setMessage("");
      if (payInvoiceResponse) {
        // setSignature(signMessageResponse.signature);
        toast({
          title: "Successfully paid invoice",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to send: " + e,
      });
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5">
      <AppHeader title="Send" description="Send sats from your node" />
      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              type="text"
              value={invoice}
              placeholder="Paste an invoice"
              onChange={(e) => {
                setInvoice(e.target.value);
              }}
            />
          </div>
          <div>
            <LoadingButton
              loading={isLoading}
              type="submit"
              disabled={!invoice}
            >
              Continue
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
