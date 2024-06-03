import { ZapIcon } from "lucide-react";
import React, { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import Container from "src/components/Container";
import TwoColumnLayoutHeader from "src/components/TwoColumnLayoutHeader";
import { Button } from "src/components/ui/button";
import { cn } from "src/lib/utils";
import { BackendType } from "src/types";

type BackendTypeDefinition = {
  id: BackendType;
  title: string;
  icon: ReactElement;
};

const backendTypes: BackendTypeDefinition[] = [
  {
    id: "LDK",
    title: "LDK",
    icon: <ZapIcon />,
  },
  {
    id: "PHOENIX",
    title: "Phoenixd",
    icon: <ZapIcon />,
  },
  {
    id: "BREEZ",
    title: "Breez SDK",
    icon: <ZapIcon />,
  },
  {
    id: "GREENLIGHT",
    title: "Greenlight",
    icon: <ZapIcon />,
  },
  {
    id: "LND",
    title: "LND",
    icon: <ZapIcon />,
  },
];

export function SetupNode() {
  const [selectedBackendType, setSelectedBackupType] =
    React.useState<BackendTypeDefinition>();
  const navigate = useNavigate();

  function next() {
    navigate(`/setup/node/${selectedBackendType?.id.toLowerCase()}`);
  }

  return (
    <>
      <Container>
        <TwoColumnLayoutHeader
          title="Choose Wallet Implementation"
          description="Decide between one of available lightning wallet backends."
        />
        <div className="flex flex-col gap-5 w-full mt-6">
          <div className="w-full grid grid-cols-2 gap-4">
            {backendTypes.map((item) => (
              <div
                className={cn(
                  "border-foreground-muted border px-4 py-6 flex flex-col gap-3 items-center rounded cursor-pointer",
                  selectedBackendType === item && "border-primary"
                )}
                onClick={() => setSelectedBackupType(item)}
              >
                {item.icon}
                {item.title}
              </div>
            ))}
          </div>
          <Button onClick={() => next()} disabled={!selectedBackendType}>
            Next
          </Button>
        </div>
      </Container>
    </>
  );
}
