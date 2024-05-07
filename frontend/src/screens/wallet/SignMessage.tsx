import React from "react";
import { Copy } from "lucide-react";
import AppHeader from "src/components/AppHeader";
import { Input } from "src/components/ui/input";
import { Button } from "src/components/ui/button";
import { Label } from "src/components/ui/label";
import { LoadingButton } from "src/components/ui/loading-button";
import { useToast } from "src/components/ui/use-toast";
import { useCSRF } from "src/hooks/useCSRF";
import { SignMessageResponse } from "src/types";
import { request } from "src/utils/request";
import { copyToClipboard } from "src/lib/clipboard";

export default function SignMessage() {
  const { data: csrf } = useCSRF();
  const { toast } = useToast();
  const [isLoading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [signature, setSignature] = React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!csrf) {
      throw new Error("csrf not loaded");
    }
    try {
      setLoading(true);
      const signMessageResponse = await request<SignMessageResponse>("/api/wallet/sign-message", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      setMessage("");
      if (signMessageResponse) {
        setSignature(signMessageResponse.signature);
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to sign message: " + e,
      });
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5">
      <AppHeader
        title="Sign Message"
        description="Manually sign a message with your node's key. Use this for example if you need to proof ownership of your node."
      />
      <div className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="">
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              type="text"
              value={message}
              placeholder=""
              onChange={(e) => {
                setMessage(e.target.value.trim());
              }}
            />
          </div>
          <div className="mt-4">
            <LoadingButton
              loading={isLoading}
              type="submit"
              disabled={!message}
              size="lg"
            >
              Sign
            </LoadingButton>
          </div>
          {signature && (<div className="flex flex-row items-center gap-2">
            <Input type="text" value={signature} className="flex-1" readOnly />
            <Button
              variant="secondary"
              size="icon"
              onClick={() => { copyToClipboard(signature); toast({ title: "Copied to clipboard." }) }}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>)}
        </form>
      </div>
    </div>
  );
}
