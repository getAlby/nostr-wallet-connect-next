import { Box, Zap } from "lucide-react";
import React, { FormEvent } from "react";
import { Link } from "react-router-dom";
import AppHeader from "src/components/AppHeader";
import ExternalLink from "src/components/ExternalLink";
import Loading from "src/components/Loading";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "src/components/ui/breadcrumb";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "src/components/ui/card";
import { Checkbox } from "src/components/ui/checkbox";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/components/ui/select";
import { Step, StepItem, Stepper, useStepper } from "src/components/ui/stepper";
import { useChannelPeerSuggestions } from "src/hooks/useChannelPeerSuggestions";
import { useInfo } from "src/hooks/useInfo";
import { cn, formatAmount } from "src/lib/utils";
import { ChannelOpening, ChannelOrderInternal } from "src/screens/channels/CurrentChannelOrder";
import { Success } from "src/screens/onboarding/Success";
import useChannelOrderStore from "src/state/ChannelOrderStore";
import {
  Network,
  NewChannelOrder,
  Node,
  RecommendedChannelPeer,
} from "src/types";
import { openLink } from "src/utils/openLink";
import { request } from "src/utils/request";

function getPeerKey(peer: RecommendedChannelPeer) {
  return JSON.stringify(peer);
}

export default function NewChannel() {
  const { data: info } = useInfo();

  if (!info?.network) {
    return <Loading />;
  }

  return <NewChannelInternal network={info.network} />;
}

function NewChannelInternal({ network }: { network: Network }) {
  const { data: channelPeerSuggestions } = useChannelPeerSuggestions();
  const [order, setOrder] = React.useState<Partial<NewChannelOrder>>({
    paymentMethod: "onchain",
    status: "pay",
  });

  const [selectedPeer, setSelectedPeer] = React.useState<
    RecommendedChannelPeer | undefined
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
    if (!channelPeerSuggestions) {
      return;
    }
    const recommendedPeer = channelPeerSuggestions.find(
      (peer) =>
        peer.network === network && peer.paymentMethod === order.paymentMethod
    );

    setSelectedPeer(recommendedPeer);
  }, [network, order.paymentMethod, channelPeerSuggestions]);

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

  const selectedCardStyles = "border-primary border-2 font-medium";
  const presetAmounts = [250_000, 500_000, 1_000_000];

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    useChannelOrderStore.getState().setOrder(order as NewChannelOrder);
    //navigate("/channels/order");
  }

  if (!channelPeerSuggestions) {
    return <Loading />;
  }

  const steps = [
    { id: "channelsize" },
    { id: "fundingmethod" },
    { id: "channelpeer" },
    { id: "depositfunds" },
    { id: "openchannel" },
  ] satisfies StepItem[];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/channels">Liquidity</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Open Channel</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <AppHeader
        title="Open a channel"
        description="Funds used to open a channel minus fees will be added to your spending balance"
      />
      <form
        onSubmit={onSubmit}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 lg:gap-10">
          <div className="flex w-full flex-col gap-4">
            <Stepper initialStep={0} steps={steps} orientation="vertical" >
              <Step id="channelsize" key="channelsize" label="Channel Size">
                <div className="grid gap-10 m-1">
                  <div className="grid gap-1.5">
                    <Input
                      id="amount"
                      type="number"
                      required
                      min={selectedPeer?.minimumChannelSize || 100000}
                      value={order.amount}
                      onChange={(e) => {
                        setAmount(e.target.value.trim());
                      }}
                    />
                    <div className="grid grid-cols-3 gap-1.5 text-muted-foreground text-xs">
                      {presetAmounts.map((amount) => (
                        <div
                          key={amount}
                          className={cn(
                            "text-center border rounded p-2 cursor-pointer hover:border-muted-foreground",
                            +(order.amount || "0") === amount &&
                            "border-primary hover:border-primary"
                          )}
                          onClick={() => setAmount(amount.toString())}
                        >
                          {formatAmount(amount * 1000, 0)}
                        </div>
                      ))}
                    </div>
                    {order.amount && +order.amount < 200_000 && (
                      <p className="text-muted-foreground text-xs">
                        For a smooth experience consider a opening a channel of 200k sats
                        in size or more.{" "}
                        <ExternalLink
                          to="https://guides.getalby.com/user-guide/v/alby-account-and-browser-extension/alby-hub/liquidity"
                          className="underline"
                        >
                          Learn more
                        </ExternalLink>
                      </p>
                    )}

                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="#"
                      onClick={() => setPaymentMethod("onchain")}
                      className="flex-1"
                    >
                      <div
                        className={cn(
                          "rounded-xl border bg-card text-card-foreground shadow p-5 flex flex-col items-center gap-3",
                          order.paymentMethod === "onchain"
                            ? selectedCardStyles
                            : undefined
                        )}
                      >
                        <Box className="w-4 h-4" />
                        Onchain
                      </div>
                    </Link>
                    <Link to="#" onClick={() => setPaymentMethod("lightning")}>
                      <div
                        className={cn(
                          "rounded-xl border bg-card text-card-foreground shadow p-5 flex flex-col items-center gap-3",
                          order.paymentMethod === "lightning"
                            ? selectedCardStyles
                            : undefined
                        )}
                      >
                        <Zap className="w-4 h-4" />
                        Lightning
                      </div>
                    </Link>
                  </div>
                  <div className="flex flex-col gap-3">
                    {selectedPeer && (<>
                      <div className="grid gap-1.5">
                        <Label>Channel peer</Label>
                        <Select
                          value={getPeerKey(selectedPeer)}
                          onValueChange={(value) =>
                            setSelectedPeer(
                              channelPeerSuggestions.find(
                                (x) => getPeerKey(x) === value
                              )
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select channel peer" />
                          </SelectTrigger>
                          <SelectContent>
                            {channelPeerSuggestions
                              .filter(
                                (peer) =>
                                  peer.network === network &&
                                  peer.paymentMethod === order.paymentMethod
                              )
                              .map((peer) => (
                                <SelectItem
                                  value={getPeerKey(peer)}
                                  key={getPeerKey(peer)}
                                >
                                  <div className="flex items-center space-between gap-3 w-full">
                                    <div className="flex items-center gap-3">
                                      {peer.name !== "Custom" && (
                                        <img
                                          src={peer.image}
                                          className="w-12 h-12 object-contain"
                                        />
                                      )}
                                      <div>
                                        {peer.name}
                                        {peer.minimumChannelSize > 0 && (
                                          <span className="ml-4 text-xs text-muted-foreground">
                                            Min.{" "}
                                            {new Intl.NumberFormat().format(
                                              peer.minimumChannelSize
                                            )}{" "}
                                            sats
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                      </div>
                      {order.paymentMethod === "onchain" && (
                        <NewChannelOnchain
                          order={order}
                          setOrder={setOrder}
                          showCustomOptions={selectedPeer?.name === "Custom"}
                        />
                      )}
                    </>)}
                  </div>

                </div>
                <StepButtons />
              </Step>
              <Step id="depositfunds" key="Deposit Funds" label="Deposit Funds">
                {/* {order.paymentMethod === "lightning" && (
                  <NewChannelLightning order={order} setOrder={setOrder} />
                )} */}
                <ChannelOrderInternal order={order} />
                <StepButtons />
              </Step>
              <Step id="openchannels" key="Open Channel" label="Open Channel">
                {order.fundingTxId ? <ChannelOpening fundingTxId={order.fundingTxId} /> : <Success />}
              </Step>
            </Stepper>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {order.amount && <div className="flex flex-row justify-between">
                  <div className="text-muted-foreground">
                    Channel Size
                  </div>
                  <div>
                    {new Intl.NumberFormat().format(
                      parseInt(order.amount)
                    )}{" "}
                    sats
                  </div>
                </div>}
              </CardContent>
              <CardFooter className="text-sm mt-5">
                Need help?{" "}
                <Button variant="link" onClick={(e) => {
                  const chatwoot = (window as any).$chatwoot;
                  if (chatwoot) {
                    chatwoot.toggle("open");
                  } else {
                    openLink("https://getalby.com/help")
                  }

                  e.preventDefault();
                }}>
                  Start a Live Chat
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </>
  );
}

type NewChannelOnchainProps = {
  order: Partial<NewChannelOrder>;
  setOrder(order: Partial<NewChannelOrder>): void;
  showCustomOptions: boolean;
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
      setNodeDetails(undefined);
      return;
    }
    try {
      const data = await request<Node>(
        `/api/mempool?endpoint=/v1/lightning/nodes/${pubkey}`
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

  return (
    <>
      <div className="flex flex-col gap-5">
        {props.showCustomOptions && (
          <>
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
              {nodeDetails && (
                <div className="ml-2 text-muted-foreground text-sm">
                  <span
                    className="mr-2"
                    style={{ color: `${nodeDetails.color}` }}
                  >
                    ⬤
                  </span>
                  {nodeDetails.alias && (
                    <>
                      {nodeDetails.alias} ({nodeDetails.active_channel_count}{" "}
                      channels)
                    </>
                  )}
                </div>
              )}
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
          </>
        )}

        <div className="mt-2 flex items-top space-x-2">
          <Checkbox
            id="public-channel"
            defaultChecked={isPublic}
            onCheckedChange={() => setPublic(!isPublic)}
            className="mr-2"
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="public-channel" className="flex items-center gap-2">
              Public Channel
            </Label>
            <p className="text-xs text-muted-foreground">
              Enable if you want to receive keysend payments. (e.g. podcasting)
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

type StepButtonProps = {
  blockNext?: boolean;
};
export function StepButtons(props: StepButtonProps) {
  const { nextStep, prevStep, isLastStep, isOptionalStep, isDisabledStep } = useStepper();
  return (
    <div className="w-full flex gap-2 mt-4 mb-4">
      <Button
        disabled={isDisabledStep}
        onClick={prevStep}
        size="sm"
        variant="secondary"
        type="button"
      >
        Back
      </Button>
      {!props.blockNext &&
        <Button size="sm" onClick={nextStep} type="button">
          {isLastStep ? "Finish" : isOptionalStep ? "Skip" : "Next"}
        </Button>
      }
    </div>
  )
}