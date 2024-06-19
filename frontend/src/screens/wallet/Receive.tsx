import React from "react";
import AppHeader from "src/components/AppHeader";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { LoadingButton } from "src/components/ui/loading-button";
import { useToast } from "src/components/ui/use-toast";
import { useCSRF } from "src/hooks/useCSRF";
import { CreateInvoiceRequest, Transaction } from "src/types";
import { request } from "src/utils/request";

export default function Receive() {
  const { data: csrf } = useCSRF();
  const { toast } = useToast();
  const [isLoading, setLoading] = React.useState(false);
  const [amount, setAmount] = React.useState<number | null>();
  const [description, setDescription] = React.useState("");

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
        body: JSON.stringify({ amount, description } as CreateInvoiceRequest),
      });
      setAmount(null);
      setDescription("");
      if (invoice) {
        // setSignature(signMessageResponse.signature);
        console.info(invoice);
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

  return (
    <div className="grid gap-5">
      <AppHeader
        title="Receive"
        description="Request instant and specific amount bitcoin payments"
      />
      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount?.toString()}
              placeholder="Amount in Satoshi..."
              onChange={(e) => {
                setAmount(parseInt(e.target.value));
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
            <LoadingButton loading={isLoading} type="submit" disabled={!amount}>
              Create Invoice
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
