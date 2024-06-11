import { useEffect, useState } from "react";
import { toast } from "src/components/ui/use-toast";
import { useAlbyMe } from "src/hooks/useAlbyMe";
import { useCSRF } from "src/hooks/useCSRF";
import { useNodeConnectionInfo } from "src/hooks/useNodeConnectionInfo";
import { request } from "src/utils/request";

export enum LinkStatus {
  SharedNode,
  ThisNode,
  OtherNode,
}

export function useLinkAccount() {
  const { data: csrf } = useCSRF();
  const { data: me } = useAlbyMe();
  const { data: nodeConnectionInfo } = useNodeConnectionInfo();
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [linkStatus, setLinkStatus] = useState<LinkStatus | undefined>();

  useEffect(() => {
    if (me && nodeConnectionInfo) {
      if (me?.keysend_pubkey === nodeConnectionInfo.pubkey) {
        setLinkStatus(LinkStatus.ThisNode);
      } else if (me.shared_node) {
        setLinkStatus(LinkStatus.SharedNode);
      } else {
        setLinkStatus(LinkStatus.OtherNode);
      }
      setLoadingInfo(false);
    }
  }, [me, nodeConnectionInfo]);

  async function linkAccount() {
    try {
      setLoading(true);
      if (!csrf) {
        throw new Error("csrf not loaded");
      }
      await request("/api/alby/link-account", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
      });
      setLinkStatus(LinkStatus.ThisNode);
      toast({
        title:
          "Your Alby Hub has successfully been linked to your Alby Account",
      });
    } catch (e) {
      toast({
        title: "Your Alby Hub couldn't be linked to your Alby Account",
        description: "Did you already link another Alby Hub?",
      });
    } finally {
      setLoading(false);
    }
  }

  return { loading, loadingInfo, linkStatus, linkAccount };
}
