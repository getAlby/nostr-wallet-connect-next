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
    setupStore.updateNodeInfo({
      backendType: "LDK",
    });

    if (searchParams.get("wallet") !== "import") {
      setupStore.updateNodeInfo({
        mnemonic: bip39.generateMnemonic(wordlist, 128),
      });
    }

    navigate("/setup/finish");
  }, [navigate, searchParams, setupStore]);

  return <Loading />;
}
