import React from "react";
import AppHeader from "src/components/AppHeader";
import Loading from "src/components/Loading";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { useToast } from "src/components/ui/use-toast";
import { useCSRF } from "src/hooks/useCSRF";
import { ConnectPeerRequest } from "src/types";
import { request } from "src/utils/request";

export default function ConnectPeer() {
  const { data: csrf } = useCSRF();
  const { toast } = useToast();
  const [isLoading, setLoading] = React.useState(false);
  const [connectionString, setConnectionString] = React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!csrf) {
      throw new Error("csrf not loaded");
    }
    if (!connectionString) {
      throw new Error("connection details missing");
    }
    const [pubkey, connectionDetails] = connectionString.split("@");
    const [address, port] = connectionDetails.split(":");
    if (!pubkey || !address || !port) {
      throw new Error("connection details missing");
    }
    console.log(`🔌 Peering with ${pubkey}`);
    const connectPeerRequest: ConnectPeerRequest = {
      pubkey,
      address,
      port: +port,
    };
    try {
      setLoading(true);
      await request("/api/peers", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(connectPeerRequest),
      });
      toast({ title: "Peer connected!" });
      setConnectionString("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5">
      <AppHeader
        title="Connect Peer"
        description="Manually connect to a lightning network peer"
      />
      <div className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="">
            <Label htmlFor="pubkey">Peer</Label>
            <Input
              id="connectionString"
              type="text"
              value={connectionString}
              placeholder="pubkey@host:port"
              onChange={(e) => {
                setConnectionString(e.target.value.trim());
              }}
            />
          </div>
          <div className="">
            <Button type="submit" disabled={!connectionString} size="lg">
              Connect
            </Button>
          </div>
          {isLoading && (<Loading />)}
        </form>
      </div>
    </div>
  );
}
