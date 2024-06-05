import { wordlist } from "@scure/bip39/wordlists/english";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Container from "src/components/Container";
import TwoColumnLayoutHeader from "src/components/TwoColumnLayoutHeader";
import { Button } from "src/components/ui/button";
import useSetupStore from "src/state/SetupStore";

import * as bip39 from "@scure/bip39";

export function LDKForm() {
  const navigate = useNavigate();
  const setupStore = useSetupStore();
  const [searchParams] = useSearchParams();

  async function handleSubmit(data: object) {
    setupStore.updateNodeInfo({
      backendType: "LDK",
      ...data,
    });

    if (searchParams.get("wallet") === "new") {
      setupStore.updateNodeInfo({
        mnemonic: bip39.generateMnemonic(wordlist, 128),
      });
    }

    navigate("/setup/finish");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSubmit({});
  }

  return (
    <Container>
      <TwoColumnLayoutHeader
        title="Configure LDK"
        description="Fill out wallet details to finish setup."
      />
      <form onSubmit={onSubmit} className="w-full grid gap-5 mt-6">
        <Button>Next</Button>
      </form>
    </Container>
  );
}
