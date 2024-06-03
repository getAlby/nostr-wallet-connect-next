import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

const quotes = [
  {
    content: `This isn't about nation-states anymore. This isn't about who adopts
        bitcoin first or who adopts cryptocurrencies first, because the
        internet is adopting cryptocurrencies, and the internet is the world's
        largest economy. It is the first transnational economy, and it needs a
        transnational currency.`,
    author: "Andreas M. Antonopoulos",
    imageUrl: "/images/quotes/andreas-antonopoulos.svg",
  },
  {
    content: `It might make sense just to get some in case it catches on. If enough people think the same way, that becomes a self fulfilling prophecy. Once it gets bootstrapped, there are so many applications if you could effortlessly pay a few cents to a website as easily as dropping coins in a vending machine.`,
    author: "Satoshi Nakamoto",
    imageUrl: "/images/quotes/satoshi-nakamoto.svg",
  },
  {
    content: `Since we’re all rich with bitcoins, or we will be once they’re worth a million dollars like everyone expects, we ought to put some of this unearned wealth to good use.`,
    author: "Hal Finney",
    imageUrl: "/images/quotes/hal-finney.svg",
  },
  {
    content: `I don't believe we shall ever have a good money again before we take the thing out of the hands of government, that is, we can't take it violently out of the hands of government, all we can do is by some sly roundabout way introduce something that they can't stop.`,
    author: "Friedrich August von Hayek",
    imageUrl: "/images/quotes/friedrich-hayek.svg",
  },
];

export default function TwoColumnFullScreenLayout() {
  const location = useLocation();
  const [quote, setQuote] = useState(
    quotes[Math.floor(Math.random() * quotes.length)]
  );

  // Change quote on route changes
  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [location]);

  return (
    <div className="w-full lg:grid lg:h-screen lg:grid-cols-2 items-stretch text-background">
      <div
        className="hidden lg:flex flex-col bg-foreground justify-end p-10 gap-2 bg-cover bg-no-repeat bg-bottom bg-opacity-50"
        style={{ backgroundImage: `url(${quote.imageUrl})` }}
      >
        <div className="flex-1 w-full h-full flex flex-col">
          <div className="flex flex-row justify-between">
            <h1 className="text-lg font-medium">Alby Hub</h1>
            {/* <ModeToggle /> */}
          </div>
        </div>
        <div className="flex flex-row gap-5">
          <div className="flex flex-col justify-center">
            <p className="text-muted-foreground text-lg mb-2">
              {quote.content}
            </p>
            <p className="text-background text-sm">{quote.author}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 text-foreground">
        <Outlet />
      </div>
    </div>
  );
}
