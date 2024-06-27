import { CircleCheck, CopyIcon } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import AppHeader from "src/components/AppHeader";
import { Button } from "src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { LoadingButton } from "src/components/ui/loading-button";
import { useToast } from "src/components/ui/use-toast";
import { useCSRF } from "src/hooks/useCSRF";
import { copyToClipboard } from "src/lib/clipboard";
import { PayInvoiceResponse } from "src/types";
import { request } from "src/utils/request";

export default function Send() {
  const { data: csrf } = useCSRF();
  const { toast } = useToast();
  const [isLoading, setLoading] = React.useState(false);
  const [invoice, setInvoice] = React.useState("");
  const [payResponse, setPayResponse] =
    React.useState<PayInvoiceResponse | null>(null);
  const [paymentDone, setPaymentDone] = React.useState(false);

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
      if (payInvoiceResponse) {
        setPayResponse(payInvoiceResponse);
        setPaymentDone(true);
        setInvoice("");
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

  const copy = () => {
    copyToClipboard(payResponse?.preimage as string);
    toast({ title: "Copied to clipboard." });
  };

  return (
    <div className="grid gap-5">
      <AppHeader title="Send" description="Send sats from your node" />
      <div className="max-w-lg">
        {paymentDone ? (
          <>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-center">
                  Payment Successful
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <CircleCheck className="w-32 h-32 mb-2" />
                <Button onClick={copy} variant="outline">
                  <CopyIcon className="w-4 h-4 mr-2" />
                  Copy Preimage
                </Button>
              </CardContent>
            </Card>
            {paymentDone && (
              <Link to="/wallet">
                <Button
                  className="mt-4 w-full"
                  onClick={() => {
                    setPaymentDone(false);
                  }}
                  variant="secondary"
                >
                  Back to Wallet
                </Button>
              </Link>
            )}
          </>
        ) : (
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
        )}
      </div>
    </div>
  );
}
