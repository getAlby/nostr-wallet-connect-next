import { Link } from "react-router-dom";
import TwoColumnLayoutHeader from "src/components/TwoColumnLayoutHeader";
import { Button } from "src/components/ui/button";
import { ALBY_MIN_BALANCE, ALBY_SERVICE_FEE } from "src/constants";
import { useAlbyBalance } from "src/hooks/useAlbyBalance";
import { useInfo } from "src/hooks/useInfo";

export default function NewChannel() {
  const { data: info } = useInfo();
  const { data: albyBalance } = useAlbyBalance();

  return (
    <div className="flex flex-col gap-8">
      <TwoColumnLayoutHeader
        title="Open a new channel"
        description="Choose how you want to obtain a channel."
      />
      <div className="flex flex-col justify-center items-center gap-4">
        {info?.backendType === "LDK" &&
          albyBalance &&
          albyBalance.sats * (1 - ALBY_SERVICE_FEE) > ALBY_MIN_BALANCE && (
            <Link to="/onboarding/lightning/migrate-alby">
              <Button variant="outline">Migrate Alby Funds</Button>
            </Link>
          )}

        {info?.backendType === "LDK" && (
          <Link to="instant">
            <Button variant="outline">Buy Instant Channel</Button>
          </Link>
        )}

        <Link to="recommended">
          <Button variant="outline">Connect with a Recommended Channel</Button>
        </Link>
        <Link to="custom">
          <Button variant="outline">Custom Channel</Button>
        </Link>
      </div>
    </div>
  );
}
