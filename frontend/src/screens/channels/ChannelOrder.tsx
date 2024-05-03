import React from "react";
import { localStorageKeys } from "src/constants";
import {
  ConnectPeerRequest,
  GetOnchainAddressResponse,
  NewChannelOrder,
  Node,
  OpenChannelRequest,
  OpenChannelResponse,
} from "src/types";

import { Payment, init } from "@getalby/bitcoin-connect-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "src/components/AppHeader";
import Loading from "src/components/Loading";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { LoadingButton } from "src/components/ui/loading-button";
import { Separator } from "src/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "src/components/ui/table";
import { useToast } from "src/components/ui/use-toast";
import { useBalances } from "src/hooks/useBalances";
import { useCSRF } from "src/hooks/useCSRF";
import { useChannels } from "src/hooks/useChannels";
import { useInfo } from "src/hooks/useInfo";
import {
  NewInstantChannelInvoiceRequest,
  NewInstantChannelInvoiceResponse,
} from "src/types";
import { request } from "src/utils/request";
init({
  showBalance: false,
});

export function ChannelOrder() {
  const orderJSON = localStorage.getItem(localStorageKeys.channelOrder);
  if (!orderJSON) {
    return <p>No pending channel order</p>;
  }
  return <ChannelOrderInternal initialOrder={JSON.parse(orderJSON)} />;
}

export function ChannelOrderInternal({
  initialOrder,
}: {
  initialOrder: NewChannelOrder;
}) {
  const [order] = React.useState<NewChannelOrder>(initialOrder);

  switch (order.status) {
    case "pay":
      switch (order.paymentMethod) {
        case "onchain":
          return <PayBitcoinChannelOrder order={order} />;
        case "lightning":
          return <PayLightningChannelOrder order={order} />;
        default:
          break;
      }
      break;
    case "success":
      return <p>TODO: success page!</p>;
    default:
      break;
  }

  return (
    <p>
      TODO: {order.status} {order.paymentMethod}
    </p>
  );
}

// TODO: move these to new files
export function PayBitcoinChannelOrder({ order }: { order: NewChannelOrder }) {
  if (order.paymentMethod !== "onchain") {
    throw new Error("incorrect payment method");
  }
  const { data: balances } = useBalances(true);

  if (!balances) {
    return <Loading />;
  }

  // TODO: do not hardcode the transaction fee
  const ESTIMATED_TRANSACTION_FEE = 10000;
  const requiredAmount = +order.amount + ESTIMATED_TRANSACTION_FEE;
  if (balances.onchain.spendable >= requiredAmount) {
    return <PayBitcoinChannelOrderWithSpendableFunds order={order} />;
  }
  if (balances.onchain.total >= requiredAmount) {
    return <PayBitcoinChannelOrderWaitingDepositConfirmation />;
  }
  return <PayBitcoinChannelOrderTopup order={order} />;
}

export function PayBitcoinChannelOrderWaitingDepositConfirmation() {
  const existingAddress = localStorage.getItem(localStorageKeys.onchainAddress);

  return (
    <>
      <p>Funds sent to address {existingAddress}</p>
      <p>
        <Loading />
        Waiting for one block confirmation. (estimated time: 10 minutes)
      </p>
    </>
  );
}

export function PayBitcoinChannelOrderTopup({
  order,
}: {
  order: NewChannelOrder;
}) {
  if (order.paymentMethod !== "onchain") {
    throw new Error("incorrect payment method");
  }

  const { data: csrf } = useCSRF();
  const [onchainAddress, setOnchainAddress] = React.useState<string>();
  const [isLoading, setLoading] = React.useState(false);

  const getNewAddress = React.useCallback(async () => {
    if (!csrf) {
      return;
    }
    setLoading(true);
    try {
      const response = await request<GetOnchainAddressResponse>(
        "/api/wallet/new-address",
        {
          method: "POST",
          headers: {
            "X-CSRF-Token": csrf,
            "Content-Type": "application/json",
          },
          //body: JSON.stringify({}),
        }
      );
      if (!response?.address) {
        throw new Error("No address in response");
      }
      localStorage.setItem(localStorageKeys.onchainAddress, response.address);
      setOnchainAddress(response.address);
    } catch (error) {
      alert("Failed to request a new address: " + error);
    } finally {
      setLoading(false);
    }
  }, [csrf]);

  React.useEffect(() => {
    const existingAddress = localStorage.getItem(
      localStorageKeys.onchainAddress
    );
    if (existingAddress) {
      setOnchainAddress(existingAddress);
      return;
    }
    getNewAddress();
  }, [getNewAddress]);

  function confirmGetNewAddress() {
    if (confirm("Do you want a fresh address?")) {
      getNewAddress();
    }
  }

  if (!onchainAddress) {
    return (
      <div className="flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <AppHeader
        title="On-chain Address"
        description="Deposit bitcoin int your wallet by sending a transaction"
      />
      <div className="grid gap-1.5 max-w-md">
        <Label htmlFor="text">On-chain Address</Label>
        <Input type="text" value={onchainAddress} />
      </div>
      <div>
        <LoadingButton
          onClick={confirmGetNewAddress}
          disabled={isLoading}
          loading={isLoading}
        >
          Get a new address
        </LoadingButton>
      </div>
    </div>
  );
}

export function PayBitcoinChannelOrderWithSpendableFunds({
  order,
}: {
  order: NewChannelOrder;
}) {
  if (order.paymentMethod !== "onchain") {
    throw new Error("incorrect payment method");
  }
  const [loading, setLoading] = React.useState(false);
  const [nodeDetails, setNodeDetails] = React.useState<Node | undefined>();
  const { data: csrf } = useCSRF();
  const { mutate: refetchInfo } = useInfo();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { pubkey, host } = order;

  const fetchNodeDetails = React.useCallback(async () => {
    if (!pubkey) {
      return;
    }
    try {
      const data = await request<Node>(
        `/api/mempool/lightning/nodes/${pubkey}`
      );
      setNodeDetails(data);
    } catch (error) {
      console.error(error);
      setNodeDetails(undefined);
    }
  }, [pubkey]);

  React.useEffect(() => {
    fetchNodeDetails();
  }, [fetchNodeDetails]);

  const connectPeer = React.useCallback(async () => {
    if (!csrf) {
      throw new Error("csrf not loaded");
    }
    if (!nodeDetails && !host) {
      throw new Error("node details not found");
    }
    const _host = nodeDetails?.sockets
      ? nodeDetails.sockets.split(",")[0]
      : host;
    const [address, port] = _host.split(":");
    if (!address || !port) {
      throw new Error("host not found");
    }
    console.log(`🔌 Peering with ${pubkey}`);
    const connectPeerRequest: ConnectPeerRequest = {
      pubkey,
      address,
      port: +port,
    };
    await request("/api/peers", {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrf,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(connectPeerRequest),
    });
  }, [csrf, nodeDetails, pubkey, host]);

  async function openChannel() {
    try {
      if (!csrf) {
        throw new Error("csrf not loaded");
      }
      if (
        order.isPublic &&
        !confirm(
          `Are you sure you want to open a public channel? in most cases a private channel is recommended.`
        )
      ) {
        return;
      }

      setLoading(true);

      await connectPeer();

      console.log(`🎬 Opening channel with ${pubkey}`);

      const openChannelRequest: OpenChannelRequest = {
        pubkey,
        amount: +order.amount,
        public: order.isPublic,
      };
      const openChannelResponse = await request<OpenChannelResponse>(
        "/api/channels",
        {
          method: "POST",
          headers: {
            "X-CSRF-Token": csrf,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(openChannelRequest),
        }
      );

      if (!openChannelResponse?.fundingTxId) {
        throw new Error("No funding txid in response");
      }
      // TODO: Success screen?
      // alert(`🎉 Published tx: ${openChannelResponse.fundingTxId}`);
      toast({
        title:
          "Published channel opening TX: " + openChannelResponse.fundingTxId,
      });
      await refetchInfo();
      // TODO: instead update order
      localStorage.removeItem(localStorageKeys.channelOrder);
      navigate("/channels");
    } catch (error) {
      console.error(error);
      alert("Something went wrong: " + error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <AppHeader
        title="Open a channel"
        description="Check the configuration and confirm to open the channel"
      />

      <div className="flex flex-col gap-5">
        <div className="grid gap-1.5">
          <Label>Channel peer</Label>
          <div className="flex flex-row items-center">
            <span
              style={{ color: `${nodeDetails?.color || "#000"}` }}
              className="mr-2"
            >
              ⬤
            </span>
            {nodeDetails?.alias ? (
              <>
                {nodeDetails.alias}
                <span className="ml-2 text-sm text-muted-foreground">
                  ({nodeDetails.active_channel_count} channels)
                </span>
              </>
            ) : (
              <>
                {pubkey}
                &nbsp;(? channels)
              </>
            )}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Channel size</Label>
          <div className="flex flex-row items-center">
            {new Intl.NumberFormat().format(+order.amount)} sats
          </div>
        </div>
        <Separator />
        <div className="inline">
          <LoadingButton
            disabled={!pubkey || !order.amount || loading}
            onClick={openChannel}
            loading={loading}
          >
            Confirm
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}

export function PayLightningChannelOrder({
  order,
}: {
  order: NewChannelOrder;
}) {
  if (order.paymentMethod !== "lightning") {
    throw new Error("incorrect payment method");
  }
  const { data: csrf } = useCSRF();
  const { mutate: refetchInfo } = useInfo();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: channels } = useChannels(true);
  const [, setRequestedInvoice] = React.useState(false);
  const [prePurchaseChannelAmount, setPrePurchaseChannelAmount] =
    React.useState<number | undefined>();
  const [wrappedInvoiceResponse, setWrappedInvoiceResponse] = React.useState<
    NewInstantChannelInvoiceResponse | undefined
  >();

  // This is not a good check if user already has enough inbound liquidity
  // - check balance instead or how else to check the invoice is paid?
  const hasOpenedChannel =
    channels &&
    prePurchaseChannelAmount !== undefined &&
    channels.length > prePurchaseChannelAmount;

  React.useEffect(() => {
    if (hasOpenedChannel) {
      (async () => {
        toast({ title: "Channel opened!" });
        await refetchInfo();
        localStorage.removeItem(localStorageKeys.channelOrder);
        navigate("/channels");
      })();
    }
  }, [hasOpenedChannel, navigate, refetchInfo, toast]);

  React.useEffect(() => {
    // TODO: move fetching to NewChannel page otherwise fee cannot be retrieved
    if (!channels || !csrf) {
      return;
    }
    setRequestedInvoice((current) => {
      if (!current) {
        (async () => {
          try {
            setPrePurchaseChannelAmount(channels.length);
            if (!order.lsp) {
              throw new Error("no lsp selected");
            }
            const newJITChannelRequest: NewInstantChannelInvoiceRequest = {
              lsp: order.lsp,
              amount: parseInt(order.amount),
            };
            const response = await request<NewInstantChannelInvoiceResponse>(
              "/api/instant-channel-invoices",
              {
                method: "POST",
                headers: {
                  "X-CSRF-Token": csrf,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(newJITChannelRequest),
              }
            );
            if (!response?.invoice) {
              throw new Error("No invoice in response");
            }
            setWrappedInvoiceResponse(response);
          } catch (error) {
            alert("Failed to connect to request wrapped invoice: " + error);
          }
        })();
      }
      return true;
    });
  }, [channels, csrf, order.amount, order.lsp]);

  return (
    <div className="flex flex-col gap-5">
      <AppHeader
        title={"Buy an Instant Channel"}
        description={
          wrappedInvoiceResponse
            ? "Complete Payment to open an instant channel to your node"
            : "Please wait, loading..."
        }
      />
      {!wrappedInvoiceResponse && <Loading />}

      {wrappedInvoiceResponse && (
        <>
          <div className="max-w-md flex flex-col gap-5">
            <div className="border rounded-lg">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium p-3 flex flex-row gap-1.5 items-center">
                      Fee
                    </TableCell>
                    <TableCell className="text-right p-3">
                      {new Intl.NumberFormat().format(wrappedInvoiceResponse.fee)}{" "}
                      sats
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium p-3">
                      Amount to pay
                    </TableCell>
                    <TableCell className="font-semibold text-right p-3">
                      {new Intl.NumberFormat().format(parseInt(order.amount))}{" "}
                      sats
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <Payment
              invoice={wrappedInvoiceResponse.invoice}
              payment={
                hasOpenedChannel ? { preimage: "dummy preimage" } : undefined
              }
              paymentMethods="external"
            />
          </div>
        </>
      )}
    </div>
  );
}
