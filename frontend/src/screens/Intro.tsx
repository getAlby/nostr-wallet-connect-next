import { EmblaCarouselType } from "embla-carousel";
import {
  ArrowRight,
  CloudLightning,
  LucideIcon,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import React, { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import Cloud from "src/assets/images/cloud.png";
import { Button } from "src/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from "src/components/ui/carousel";
import { useTheme } from "src/components/ui/theme-provider";
import { useInfo } from "src/hooks/useInfo";
import { cn } from "src/lib/utils";

export function Intro() {
  const { data: info } = useInfo();
  const navigate = useNavigate();
  const [api, setApi] = React.useState<CarouselApi>();
  const { theme } = useTheme();

  React.useEffect(() => {
    if (!info?.setupCompleted) {
      return;
    }
    navigate("/");
  }, [info, navigate]);

  return (
    <Carousel className={cn("w-full bg-background")} setApi={setApi}>
      <div
        className="w-full h-full absolute top-0 left-0 bg-no-repeat"
        style={{
          backgroundImage: `url(${Cloud})`,
          filter: theme === "light" ? "invert(1)" : undefined,
        }}
      />
      <CarouselContent className="select-none bg-transparent">
        <CarouselItem>
          <div className="flex flex-col justify-center items-center h-screen p-5">
            <div className="flex flex-col gap-4 text-center max-w-lg">
              <div className="text-4xl font-extrabold text-foreground">
                Welcome to Alby Hub
              </div>
              <div className="text-2xl text-muted-foreground font-semibold">
                A powerful, all-in-one lightning wallet with a superpower of
                connecting into apps
              </div>
              <div className="mt-5">
                <Button
                  variant="secondary"
                  onClick={() => api?.scrollNext()}
                  size="lg"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </CarouselItem>
        <CarouselItem>
          <Slide
            api={api}
            icon={CloudLightning}
            title="Alby Hub Lives in a Cloud"
            description="Your wallet is always online and ready to use on any device."
          />
        </CarouselItem>
        <CarouselItem>
          <Slide
            api={api}
            icon={ShieldCheck}
            title="Your Keys Are Safe"
            description="You wallet is encrypted by a password of your choice. No one can access your funds but you."
          />
        </CarouselItem>
        <CarouselItem>
          <Slide
            api={api}
            icon={Wallet}
            title="Bring Your Wallet With You"
            description="Connect your wallet to dozens of apps and participate in the bitcoin digital economy."
          />
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  );
}

function Slide({
  api,
  title,
  description,
  icon: Icon,
}: {
  api: EmblaCarouselType | undefined;
  title: string;
  description: string;
  icon: LucideIcon;
  button?: ReactElement;
}) {
  const navigate = useNavigate();

  const slideNext = function () {
    if (api?.canScrollNext()) {
      api.scrollNext();
    } else {
      navigate("/welcome");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen gap-8 p-5">
      <Icon className="w-16 h-16 text-primary-background" />
      <div className="flex flex-col gap-4 text-center items-center max-w-lg">
        <div className="text-3xl font-semibold text-primary-background">
          {title}
        </div>
        <div className="text-lg text-muted-foreground font-semibold">
          {description}
        </div>
      </div>
      <CarouselDots />
      <Button size="icon" onClick={slideNext} className="mt-5">
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
