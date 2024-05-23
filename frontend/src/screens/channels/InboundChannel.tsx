import { Link } from "react-router-dom";
import AppHeader from "src/components/AppHeader.tsx";
import CardButton from "src/components/CardButton.tsx";
import ExternalLink from "src/components/ExternalLink.tsx";


export default function InboundChannel() {

  return (
    <>
      <AppHeader
        title="Increase Receiving Capacity"
        description="Choose how you want to increase your receiving capacity"
      />
      <div className="grid gap-12">


        <div className="grid gap-4 max-w-lg">
          <p>
            How do you want to increase your receiving capacity?
          </p>
          <CardButton title="Request a channel from a partner provider" description="Pay one of our partner providers to open a channel to you" to="/channels/new" />
          <CardButton title="Request a channel from a friend" description="Ask your friends or family to open a lightning channel to you" to="/channels/new" />
          <CardButton title="Swap out to on-chain address" description="Move your bitcoin from spending balance to savings balance" to="/channels/onchain/new-address" />
        </div>

        <div>
          <h2 className="font-medium text-lg">
            Increase by Spending
          </h2>
          <p className="text-muted-foreground">
            Your receiving capacity will increase by just spending bitcoin from
            your spending balance, e.g. in one of the apps from the <Link to="" className="text-foreground underline" >app store</Link>,
            buying giftcards on <ExternalLink to="https://bitrefill.com" className="text-foreground underline">Bitrefill</ExternalLink> or by just sending some bitcoin out to
            another lightning wallet. Your receiving capacity will increase by
            the amount of sats you spend or withdraw.
          </p>
        </div>
      </div>
    </>
  );
}
