import React from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "src/components/AppHeader";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { LoadingButton } from "src/components/ui/loading-button";
import { useToast } from "src/components/ui/use-toast";
import { useCSRF } from "src/hooks/useCSRF";
import { useChannels } from "src/hooks/useChannels";
import { request } from "src/utils/request";

export default function DisconnectPeer() {
  const { data: csrf } = useCSRF();
  const { toast } = useToast();
  const [isLoading, setLoading] = React.useState(false);
  const [peerId, setPeerId] = React.useState("");
  const { data: channels } = useChannels();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!csrf) {
      throw new Error("csrf not loaded");
    }
    if (!peerId) {
      throw new Error("peer missing");
    }
    if (!channels) {
      throw new Error("channels not loaded");
    }
    if (channels.some((channel) => channel.remotePubkey === peerId)) {
      throw new Error("you have one or more open channels with " + peerId);
    }
    if (
      !confirm("Are you sure you wish to disconnect with peer " + peerId + "?")
    ) {
      return;
    }
    try {
      console.log(`Disconnecting from ${peerId}`);

      setLoading(true);
      await request(`/api/peers/${peerId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": csrf,
        },
      });
      toast({ title: "Successfully disconnected from peer " + peerId });
      setPeerId("");
      navigate("/channels");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to disconnect peer: " + e,
      });
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5">
      <AppHeader
        title="Disconnect Peer"
        description="Manually disconnect from a lightning network peer"
      />
      <div className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="">
            <Label htmlFor="connectionString">Peer ID</Label>
            <Input
              id="connectionString"
              type="text"
              value={peerId}
              placeholder="035e4ff418fc8b5554c5d9eea66396c227bd429a3251c8cbc711002ba215bfc226"
              onChange={(e) => {
                setPeerId(e.target.value.trim());
              }}
            />
          </div>
          <div className="mt-4">
            <LoadingButton
              variant="destructive"
              loading={isLoading}
              type="submit"
              disabled={!peerId}
              size="lg"
            >
              Disconnect
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
