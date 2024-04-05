import confetti from "canvas-confetti";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import TwoColumnLayoutHeader from "src/components/TwoColumnLayoutHeader";
import { LoadingButton } from "src/components/ui/loading-button";
import { useToast } from "src/components/ui/use-toast";
import { useCSRF } from "src/hooks/useCSRF";
import { request } from "src/utils/request";

export function ConnectAlbyAccount() {
  const [loading, setLoading] = React.useState(false);
  const { data: csrf } = useCSRF();
  const { toast } = useToast();
  const navigate = useNavigate();

  async function changeAlbyAccountNode() {
    setLoading(true);
    try {
      if (!csrf) {
        throw new Error("No CSRF token");
      }
      await request(`/api/alby/connect-account`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
      });
      navigate("/");
      confetti();
    } catch (error) {
      toast({
        title: "Failed to connect Alby Account",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col justify-center gap-5 p-5 max-w-md items-stretch">
      <TwoColumnLayoutHeader
        title="Connect Alby Account"
        description="It's time for your Alby Account to go self-sovereign."
      />

      <p>
        Your Alby Account will now be connected to Alby Hub with an initial
        budget of <span className="font-bold font-emoji">100,000</span> sats per
        month. You can change this at any time in your connected apps.
      </p>

      <p>
        Your Alby Account powers your{" "}
        <span className="font-bold">lightning address</span>,{" "}
        <span className="font-emoji">https://getalby.com</span> web wallet,
        wallet API, legacy NWC connections, podcasting apps and more.
      </p>

      <form onSubmit={changeAlbyAccountNode}>
        <LoadingButton type="submit" loading={loading} className="w-full">
          Connect Alby Account
        </LoadingButton>
      </form>
      {!loading && (
        <Link to="/" className="flex justify-center text-sm">
          Skip for now
        </Link>
      )}
    </div>
  );
}
