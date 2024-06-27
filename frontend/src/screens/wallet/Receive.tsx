import confetti from "canvas-confetti";
import { CircleCheck, CopyIcon } from "lucide-react";
import React from "react";
import AppHeader from "src/components/AppHeader";
import Loading from "src/components/Loading";
import QRCode from "src/components/QRCode";
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
import { useInvoice } from "src/hooks/useInvoice";
import { copyToClipboard } from "src/lib/clipboard";
import { CreateInvoiceRequest, Transaction } from "src/types";
import { request } from "src/utils/request";

export default function Receive() {
  const { data: csrf } = useCSRF();
  const { toast } = useToast();
  const [isLoading, setLoading] = React.useState(false);
  const [amount, setAmount] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [invoice, setInvoice] = React.useState<Transaction | null>(null);
  const [paymentDone, setPaymentDone] = React.useState(false);
  const { data: invoiceData } = useInvoice(
    invoice ? invoice.payment_hash : "",
    true
  );

  React.useEffect(() => {
    if (invoiceData?.settled_at) {
      setPaymentDone(true);
      popConfetti();
      toast({
        title: "Payment done!",
      });
    }
  }, [invoiceData, toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!csrf) {
      throw new Error("csrf not loaded");
    }
    try {
      setLoading(true);
      const invoice = await request<Transaction>("/api/wallet/receive", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: (parseInt(amount) || 0) * 1000,
          description,
        } as CreateInvoiceRequest),
      });
      setAmount("");
      setDescription("");
      if (invoice) {
        setInvoice(invoice);

        toast({
          title: "Successfully created invoice",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to create invoice: " + e,
      });
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    copyToClipboard(invoice?.invoice as string);
    toast({ title: "Copied to clipboard." });
  };

  const popConfetti = () => {
    for (let i = 0; i < 10; i++) {
      setTimeout(
        () => {
          confetti({
            origin: {
              x: Math.random(),
              y: Math.random(),
            },
            colors: ["#000", "#333", "#666", "#999", "#BBB", "#FFF"],
          });
        },
        Math.floor(Math.random() * 1000)
      );
    }
  };

  return (
    <div className="grid gap-5">
      <AppHeader
        title="Receive"
        description="Request instant and specific amount bitcoin payments"
      />
      <div className="max-w-lg">
        {invoice ? (
          <>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-center">
                  {paymentDone ? "Payment Received" : "Invoice"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {paymentDone ? (
                  <>
                    <CircleCheck className="w-32 h-32 mb-2" />
                    <p>Received {(invoiceData?.amount ?? 0) / 1000} sats</p>
                  </>
                ) : (
                  <>
                    <div className="flex flex-row items-center gap-2 text-sm">
                      <Loading className="w-4 h-4" />
                      <p>Waiting for payment</p>
                    </div>
                    <QRCode value={invoice.invoice} className="w-full" />
                    <div>
                      <Button onClick={copy} variant="outline">
                        <CopyIcon className="w-4 h-4 mr-2" />
                        Copy Invoice
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            {paymentDone && (
              <Button
                className="mt-4 w-full"
                onClick={() => {
                  setPaymentDone(false);
                  setInvoice(null);
                }}
              >
                Receive another payment
              </Button>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount?.toString()}
                placeholder="Amount in Satoshi..."
                onChange={(e) => {
                  setAmount(e.target.value.trim());
                }}
                min={1}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                value={description}
                placeholder="For e.g. who is sending this payment?"
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
              />
            </div>
            <div>
              <LoadingButton
                loading={isLoading}
                type="submit"
                disabled={!amount}
              >
                Create Invoice
              </LoadingButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
