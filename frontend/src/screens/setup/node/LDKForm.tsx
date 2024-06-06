import { wordlist } from "@scure/bip39/wordlists/english";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useSetupStore from "src/state/SetupStore";

import * as bip39 from "@scure/bip39";
import Loading from "src/components/Loading";

export function LDKForm() {
  const navigate = useNavigate();
  const setupStore = useSetupStore();
  const [searchParams] = useSearchParams();

  // No configuration needed, automatically proceed with the next step
  useEffect(() => {
    if (searchParams.get("wallet") !== "import") {
      setupStore.updateNodeInfo({
        backendType: "LDK",
        mnemonic: bip39.generateMnemonic(wordlist, 128),
      });
    } else {
      setupStore.updateNodeInfo({
        backendType: "LDK",
      });
    }

    navigate("/setup/finish");

    // This method should only be run once, adding dependencies
    // causes endless loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Loading />;
}
