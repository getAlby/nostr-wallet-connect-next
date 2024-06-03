import React from "react";
import { useNavigate } from "react-router-dom";
import Container from "src/components/Container";
import TwoColumnLayoutHeader from "src/components/TwoColumnLayoutHeader";
import { Button } from "src/components/ui/button";
import useSetupStore from "src/state/SetupStore";

export function LDKForm() {
  const navigate = useNavigate();
  const setupStore = useSetupStore();

  async function handleSubmit(data: object) {
    setupStore.updateNodeInfo({
      backendType: "LDK",
      ...data,
    });
    navigate("/setup/import-mnemonic");
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
