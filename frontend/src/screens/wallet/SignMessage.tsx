import { Check, Copy } from "lucide-react";
import React from "react";
import AppHeader from "src/components/AppHeader";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { LoadingButton } from "src/components/ui/loading-button";
import { useToast } from "src/components/ui/use-toast";
import { useCSRF } from "src/hooks/useCSRF";
import { copyToClipboard } from "src/lib/clipboard";
import { SignMessageResponse } from "src/types";
import { request } from "src/utils/request";

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
      const signMessageResponse = await request<SignMessageResponse>(
        "/api/wallet/sign-message",
        {
          method: "POST",
          headers: {
            "X-CSRF-Token": csrf,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: message.trim() }),
        }
      );
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
        {!signature && (
          <form onSubmit={handleSubmit}>
            <div className="">
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                type="text"
                value={message}
                placeholder=""
                onChange={(e) => {
                  setMessage(e.target.value);
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
          </form>
        )}
        {signature && (
          <>
            <div className="mt-4 flex items-center gap-1 mb-1">
              <Check className="w-4 h-4" />
              <p className="text-sm">Message signed</p>
            </div>
            <div className="flex flex-row items-center gap-2">
              <Input
                type="text"
                value={signature}
                className="flex-1"
                readOnly
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => {
                  copyToClipboard(signature);
                  toast({ title: "Copied to clipboard." });
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="mt-4"
              onClick={() => setSignature("")}
            >
              Sign another message
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
