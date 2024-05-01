import React, { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import albyImage from "src/assets/images/peers/alby.svg";
import mutinynetImage from "src/assets/images/peers/mutinynet.jpeg";
import olympusImage from "src/assets/images/peers/olympus.svg";
import AppHeader from "src/components/AppHeader";
import Loading from "src/components/Loading";
import { Alert, AlertDescription, AlertTitle } from "src/components/ui/alert";
import { Button } from "src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import { Checkbox } from "src/components/ui/checkbox";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import {
  ALBY_MIN_BALANCE,
  ALBY_SERVICE_FEE,
  localStorageKeys,
} from "src/constants";
import { useAlbyBalance } from "src/hooks/useAlbyBalance";
import { useInfo } from "src/hooks/useInfo";
import { Network, NewChannelOrder, Node } from "src/types";
import { request } from "src/utils/request";

type RecommendedPeer = {
  network: Network;
  image: string;
  name: string;
  minimumChannelSize: number;
} & (
  | {
      paymentMethod: "onchain";
      pubkey: string;
      host: string;
    }
  | {
      paymentMethod: "lightning";
      lsp: string;
    }
);

const recommendedPeers: RecommendedPeer[] = [
  {
    network: "bitcoin",
    paymentMethod: "onchain",
    pubkey:
      "029ca15ad2ea3077f5f0524c4c9bc266854c14b9fc81b9cc3d6b48e2460af13f65",
    host: "141.95.84.44:9735",
    minimumChannelSize: 250_000,
    name: "Alby",
    image: albyImage,
  },

  {
    network: "testnet",
    paymentMethod: "onchain",
    pubkey:
      "030f8fcc69816d90445f450e59304171fd805f4395a0f4950a5956ce3300463f5a",
    host: "209.38.178.74:9735",
    minimumChannelSize: 50_000,
    name: "Alby Testnet LND2",
    image: albyImage,
  },
  {
    paymentMethod: "onchain",
    network: "signet",
    pubkey:
      "02465ed5be53d04fde66c9418ff14a5f2267723810176c9212b722e542dc1afb1b",
    host: "45.79.52.207:9735",
    minimumChannelSize: 50_000,
    name: "Mutinynet Faucet",
    image: mutinynetImage,
  },
  {
    paymentMethod: "lightning",
    network: "signet",
    lsp: "OLYMPUS_MUTINYNET_LSPS1",
    minimumChannelSize: 1_000_000,
    name: "Olympus Mutinynet (LSPS1)",
    image: olympusImage,
  },
  {
    paymentMethod: "lightning",
    network: "signet",
    lsp: "OLYMPUS_MUTINYNET_FLOW_2_0",
    minimumChannelSize: 10_000,
    name: "Olympus Mutinynet (Flow 2.0)",
    image: olympusImage,
  },
];

export default function NewChannel() {
  const { data: info } = useInfo();

  if (!info?.network) {
    return <Loading />;
  }

  return <NewChannelInternal network={info.network} />;
}

function NewChannelInternal({ network }: { network: Network }) {
  const { data: info } = useInfo();
  const { data: albyBalance } = useAlbyBalance();
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const navigate = useNavigate();
  // const [loading, setLoading] = React.useState(false);

  const [order, setOrder] = React.useState<Partial<NewChannelOrder>>({
    paymentMethod: "onchain",
    status: "pay",
  });

  const [selectedPeer, setSelectedPeer] = React.useState<
    RecommendedPeer | undefined
  >();

  function setPaymentMethod(paymentMethod: "onchain" | "lightning") {
    setOrder({
      ...order,
      paymentMethod,
    });
  }
  const setAmount = React.useCallback((amount: string) => {
    setOrder((current) => ({
      ...current,
      amount,
    }));
  }, []);

  React.useEffect(() => {
    const recommendedPeer = recommendedPeers.find(
      (peer) =>
        peer.network === network && peer.paymentMethod === order.paymentMethod
    );

    setSelectedPeer(recommendedPeer);
  }, [network, order.paymentMethod, setAmount]);

  React.useEffect(() => {
    if (selectedPeer) {
      if (
        selectedPeer.paymentMethod === "onchain" &&
        order.paymentMethod === "onchain"
      ) {
        setOrder((current) => ({
          ...current,
          pubkey: selectedPeer.pubkey,
          host: selectedPeer.host,
        }));
      }
      if (
        selectedPeer.paymentMethod === "lightning" &&
        order.paymentMethod === "lightning"
      ) {
        setOrder((current) => ({
          ...current,
          lsp: selectedPeer.lsp,
        }));
      }
      setAmount(selectedPeer.minimumChannelSize.toString());
    }
  }, [order.paymentMethod, selectedPeer, setAmount]);

  const selectedCardStyles = "border-primary border-2";

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    localStorage.setItem(localStorageKeys.channelOrder, JSON.stringify(order));
    navigate("/channels/order");
  }

  return (
    <>
      <AppHeader
        title="Open a channel"
        description="Funds used to open a channel minus fees will be added to your spending balance"
      />
      {/* TODO: move to somewhere else */}
      {info?.backendType === "LDK" &&
        albyBalance &&
        albyBalance.sats * (1 - ALBY_SERVICE_FEE) > ALBY_MIN_BALANCE && (
          <Alert>
            <AlertTitle className="mb-4">
              You have funds on your Alby shared account!
            </AlertTitle>
            <AlertDescription>
              <Link to="/onboarding/lightning/migrate-alby">
                <Button variant="outline">Migrate Alby Funds</Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Amount (sats)</Label>
            <Input
              id="amount"
              type="number"
              required
              min={selectedPeer?.minimumChannelSize}
              value={order.amount}
              onChange={(e) => {
                setAmount(e.target.value.trim());
              }}
            />
            <div className="grid gap-1.5">
              <Label htmlFor="amount">Payment method</Label>

              <div className="flex gap-2 items-center">
                <Link to="#" onClick={() => setPaymentMethod("onchain")}>
                  <Card
                    className={
                      order.paymentMethod === "onchain"
                        ? selectedCardStyles
                        : undefined
                    }
                  >
                    <CardHeader>
                      <CardTitle>Onchain</CardTitle>
                    </CardHeader>
                    <CardContent></CardContent>
                  </Card>
                </Link>
                <Link to="#" onClick={() => setPaymentMethod("lightning")}>
                  <Card
                    className={
                      order.paymentMethod === "lightning"
                        ? selectedCardStyles
                        : undefined
                    }
                  >
                    <CardHeader>
                      <CardTitle>Lightning</CardTitle>
                    </CardHeader>
                    <CardContent></CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            <>
              <div className="flex items-center gap-5">
                {selectedPeer &&
                (selectedPeer.paymentMethod === "lightning" ||
                  (order.paymentMethod === "onchain" &&
                    selectedPeer.pubkey === order.pubkey)) ? (
                  <div>
                    Channel peer{" "}
                    <img src={selectedPeer.image} className="w-16 h-16" />
                    <p>{selectedPeer.name}</p>
                    Select another peer
                    <div className="flex gap-2 items-center">
                      {recommendedPeers
                        .filter(
                          (peer) =>
                            peer.network === network &&
                            peer.paymentMethod === order.paymentMethod
                        )
                        .map((peer) => (
                          <Link to="#" onClick={() => setSelectedPeer(peer)}>
                            <Card
                              key={peer.name}
                              className={
                                peer === selectedPeer
                                  ? selectedCardStyles
                                  : undefined
                              }
                            >
                              <CardHeader>
                                <CardTitle>{peer.name}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <img src={peer.image} className="w-24 h-24" />
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p>No recommended peer found</p>
                )}
                {
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowAdvanced((current) => !current)}
                    >
                      {showAdvanced ? "Hide" : "Show"}&nbsp;Advanced Options
                    </Button>
                  </div>
                }
              </div>
            </>
          </div>
          {order.paymentMethod === "onchain" && (
            <NewChannelOnchain
              order={order}
              setOrder={setOrder}
              showAdvanced={showAdvanced}
            />
          )}
          {order.paymentMethod === "lightning" && (
            <NewChannelLightning order={order} setOrder={setOrder} />
          )}
        </div>
        <Button>Next</Button>
      </form>
    </>
  );
}

type NewChannelLightningProps = {
  order: Partial<NewChannelOrder>;
  setOrder(order: Partial<NewChannelOrder>): void;
};

function NewChannelLightning(props: NewChannelLightningProps) {
  if (props.order.paymentMethod !== "lightning") {
    throw new Error("unexpected payment method");
  }
  return null;
}

type NewChannelOnchainProps = {
  order: Partial<NewChannelOrder>;
  setOrder(order: Partial<NewChannelOrder>): void;
  showAdvanced: boolean;
};

function NewChannelOnchain(props: NewChannelOnchainProps) {
  const [nodeDetails, setNodeDetails] = React.useState<Node | undefined>();

  // const { data: csrf } = useCSRF();
  if (props.order.paymentMethod !== "onchain") {
    throw new Error("unexpected payment method");
  }
  const { pubkey, host, isPublic } = props.order;

  function setPubkey(pubkey: string) {
    props.setOrder({
      ...props.order,
      paymentMethod: "onchain",
      pubkey,
    });
  }
  function setHost(host: string) {
    props.setOrder({
      ...props.order,
      paymentMethod: "onchain",
      host,
    });
  }
  function setPublic(isPublic: boolean) {
    props.setOrder({
      ...props.order,
      paymentMethod: "onchain",
      isPublic,
    });
  }

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

  /*const connectPeer = React.useCallback(async () => {
    if (!csrf) {
      throw new Error("csrf not loaded");
    }
    if (!nodeDetails && !host) {
      throw new Error("node details not found");
    }
    const _host = nodeDetails ? nodeDetails.sockets.split(",")[0] : host;
    if (!_host || !pubkey) {
      throw new Error("host or pubkey unset");
    }
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
  }, [csrf, nodeDetails, pubkey, host]);*/

  /*async function openChannel() {
    try {
      if (!csrf) {
        throw new Error("csrf not loaded");
      }
      if (
        isPublic &&
        !confirm(
          `Are you sure you want to open a public channel? in most cases a private channel is recommended.`
        )
      ) {
        return;
      }
      if (
        !confirm(
          `Are you sure you want to peer with ${nodeDetails?.alias || pubkey}?`
        )
      ) {
        return;
      }

      setLoading(true);

      await connectPeer();

      if (
        !confirm(
          `Are you sure you want to open a ${localAmount} sat channel to ${
            nodeDetails?.alias || pubkey
          }?`
        )
      ) {
        setLoading(false);
        return;
      }

      console.log(`🎬 Opening channel with ${pubkey}`);

      const openChannelRequest: OpenChannelRequest = {
        pubkey,
        amount: +localAmount,
        public: isPublic,
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

      alert(`🎉 Published tx: ${openChannelResponse.fundingTxId}`);
    } catch (error) {
      console.error(error);
      alert("Something went wrong: " + error);
    } finally {
      setLoading(false);
    }
  }*/

  /*const description = nodeDetails?.alias ? (
    <>
      Open a channel with an onchain payment to{" "}
      <span style={{ color: `${nodeDetails.color}` }}>⬤</span>{" "}
      {nodeDetails.alias} (${nodeDetails.active_channel_count} channels)
    </>
  ) : (
    "Open a channel with an onchain payment to a node on the lightning network"
  );*/

  return (
    <>
      {!props.showAdvanced && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-1.5">
            {nodeDetails && (
              <h3 className="font-medium text-2xl">
                <span style={{ color: `${nodeDetails.color}` }}>⬤</span>
                {nodeDetails.alias && (
                  <>
                    {nodeDetails.alias} ({nodeDetails.active_channel_count}{" "}
                    channels)
                  </>
                )}
              </h3>
            )}
          </div>
        </div>
      )}
      {props.showAdvanced && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-1.5">
            {nodeDetails && (
              <h3 className="font-medium text-2xl">
                <span style={{ color: `${nodeDetails.color}` }}>⬤</span>
                {nodeDetails.alias && (
                  <>
                    {nodeDetails.alias} ({nodeDetails.active_channel_count}{" "}
                    channels)
                  </>
                )}
              </h3>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pubkey">Peer</Label>
            <Input
              id="pubkey"
              type="text"
              value={pubkey}
              placeholder="Pubkey of the peer"
              onChange={(e) => {
                setPubkey(e.target.value.trim());
              }}
            />
          </div>

          {!nodeDetails && pubkey && (
            <div className="grid gap-1.5">
              <Label htmlFor="host">Host:Port</Label>
              <Input
                id="host"
                type="text"
                value={host}
                placeholder="0.0.0.0:9735"
                onChange={(e) => {
                  setHost(e.target.value.trim());
                }}
              />
            </div>
          )}

          <div className="flex w-full items-center">
            <Checkbox
              id="public-channel"
              defaultChecked={isPublic}
              onCheckedChange={() => setPublic(!isPublic)}
              className="mr-2"
            />
            <Label htmlFor="public-channel">Public Channel</Label>
          </div>
          <div className="inline"></div>
        </div>
      )}

      {/*<LoadingButton
        disabled={!pubkey || !localAmount || loading}
        onClick={openChannel}
        loading={loading}
      >
        Next
    </LoadingButton>*/}
    </>
  );
}
