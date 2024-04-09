import { Label } from "@radix-ui/react-dropdown-menu";
import React from "react";
import QRCode from "react-qr-code";
import alby from "src/assets/suggested-apps/alby.png";
import amethyst from "src/assets/suggested-apps/amethyst.png";
import bc from "src/assets/suggested-apps/bitcoin-connect.png";
import damus from "src/assets/suggested-apps/damus.png";
import hablanews from "src/assets/suggested-apps/habla-news.png";
import kiwi from "src/assets/suggested-apps/kiwi.png";
import lume from "src/assets/suggested-apps/lume.png";
import nostrudel from "src/assets/suggested-apps/nostrudel.png";
import nostur from "src/assets/suggested-apps/nostur.png";
import primal from "src/assets/suggested-apps/primal.png";
import snort from "src/assets/suggested-apps/snort.png";
import wavelake from "src/assets/suggested-apps/wavelake.png";
import wherostr from "src/assets/suggested-apps/wherostr.png";
import yakihonne from "src/assets/suggested-apps/yakihonne.png";
import zapstream from "src/assets/suggested-apps/zap-stream.png";
import zapplanner from "src/assets/suggested-apps/zapplanner.png";
import zapplepay from "src/assets/suggested-apps/zapple-pay.png";
import zappybird from "src/assets/suggested-apps/zappy-bird.png";
import { Button } from "src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "src/components/ui/card";
import { Checkbox } from "src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "src/components/ui/dialog";
import { Input } from "src/components/ui/input";
import { SuggestedApp } from "src/types";

const suggestedApps: SuggestedApp[] = [
  {
    title: "Alby Extension",
    description: "Wallet in your browser",
    to: "https://getalby.com/",
    logo: alby,
  },
  {
    title: "Damus",
    description: "iOS Nostr client",
    to: "https://damus.io/?utm_source=getalby",
    logo: damus,
  },
  {
    title: "Amethyst",
    description: "Android Nostr client",
    to: "https://play.google.com/store/apps/details?id=com.vitorpamplona.amethyst&hl=de&gl=US",
    logo: amethyst,
  },
  {
    title: "Primal",
    description: "Cross-platform social",
    to: "https://primal.net/",
    logo: primal,
  },
  {
    title: "Zap Stream",
    description: "Stream and stack sats",
    to: "https://zap.stream/",
    logo: zapstream,
  },
  {
    title: "Wavlake",
    description: "Creators platform",
    to: "https://www.wavlake.com/",
    logo: wavelake,
  },
  {
    title: "Snort",
    description: "Web Nostr client",
    to: "https://snort.social/",
    logo: snort,
  },
  {
    title: "Habla News",
    description: "Blogging platform",
    to: "https://habla.news/",
    logo: hablanews,
  },
  {
    title: "noStrudel",
    description: "Web Nostr client",
    to: "https://nostrudel.ninja/",
    logo: nostrudel,
  },
  {
    title: "YakiHonne",
    description: "Blogging platform",
    to: "https://yakihonne.com/",
    logo: yakihonne,
  },
  {
    title: "ZapPlanner",
    description: "Schedule payments",
    to: "https://zapplanner.albylabs.com/",
    logo: zapplanner,
  },
  {
    title: "Zapple Pay",
    description: "Zap from any client",
    to: "https://www.zapplepay.com/",
    logo: zapplepay,
  },
  {
    title: "Lume",
    description: "macOS Nostr client",
    to: "https://lume.nu/",
    logo: lume,
  },
  {
    title: "Bitcoin Connect",
    description: "Connect to apps",
    to: "https://bitcoin-connect.com/",
    logo: bc,
  },
  {
    title: "Kiwi",
    description: "Nostr communities",
    to: "https://nostr.kiwi/",
    logo: kiwi,
  },
  {
    title: "Zappy Bird",
    description: "Loose sats quickly",
    to: "https://rolznz.github.io/zappy-bird/",
    logo: zappybird,
  },
  {
    title: "Nostur",
    description: "Social media",
    to: "https://nostur.com/",
    logo: nostur,
  },
  {
    title: "Wherostr",
    description: "Map of notes",
    to: "https://wherostr.social/",
    logo: wherostr,
  },
];

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" value="@peduarte" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SuggestedApp({ to, title, description, logo }: SuggestedApp) {
  const [connecting, setConnecting] = React.useState(false);

  return (
    <Dialog>
      <DialogTrigger>
        <Card className="text-left">
          <CardContent className="pt-6">
            <div className="flex gap-3 items-center">
              <img
                src={logo}
                alt="logo"
                className="inline rounded-lg w-10 h-10"
              />
              <div className="flex-grow">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        {!connecting && (
          <>
            <DialogHeader>Connect to {title}</DialogHeader>
            <div className="text-muted-foreground text-sm -mt-3 mb-3">
              Configure wallet permissions for the app
            </div>
            <div className="flex flex-row justify-center items-center gap-2">
              <img
                src={logo}
                alt="logo"
                className="inline rounded-lg w-10 h-10"
              />
              <h3 className="font-semibold text-2xl">{title}</h3>
            </div>
            <div>
              <h3 className="font-semibold">Authorize the app to:</h3>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox id="terms" />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Send payments
                </label>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Monthly budget</h3>
              <div className="flex items-center space-x-2 mt-2">100k sats</div>
            </div>
            <Button onClick={() => setConnecting(true)}>Continue</Button>
          </>
        )}
        {connecting && (
          <>
            <DialogHeader>Finalize connection</DialogHeader>
            <DialogContent>
              <div className="text-muted-foreground text-sm -mt-3 mb-3">
                ...
              </div>
              <QRCode value="123" />
            </DialogContent>
            <DialogFooter>
              <Button variant={"secondary"}>Copy Connection Secret</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SuggestedApps() {
  return (
    <>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {suggestedApps.map((app) => (
          <SuggestedApp
            key={app.title}
            to={app.to}
            title={app.title}
            description={app.description}
            logo={app.logo}
          />
        ))}
      </div>
    </>
  );
}
