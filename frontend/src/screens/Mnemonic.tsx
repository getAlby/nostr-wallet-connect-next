import React, { useState } from "react";
import {
  PopiconsLifebuoyLine,
  PopiconsShieldLine,
  PopiconsTriangleExclamationLine,
} from "@popicons/react";
import { useNavigate } from "react-router-dom";

import MnemonicInputs from "src/components/MnemonicInputs";
import ConnectButton from "src/components/ConnectButton";
import Container from "src/components/Container";
import Input from "src/components/Input";
import PasswordViewAdornment from "src/components/PasswordAdornment";
import { aesGcmDecrypt } from "src/utils/aes";
import { useMnemonic } from "src/hooks/useMnemonic";
import Loading from "src/components/Loading";
import toast from "src/components/Toast";
import { handleRequestError } from "src/utils/handleRequestError";
import { request } from "src/utils/request";
import { useCSRF } from "src/hooks/useCSRF";

export function Mnemonic() {
  const navigate = useNavigate();
  const { data: csrf } = useCSRF();
  const { data: mnemonic } = useMnemonic();

  const [unlockPassword, setUnlockPassword] = React.useState("");
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [decryptedMnemonic, setDecryptedMnemonic] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [backedUp, isBackedUp] = useState<boolean>(false);

  if (!mnemonic) {
    return <Loading />;
  }

  const onSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const dec = await aesGcmDecrypt(mnemonic.mnemonic, unlockPassword);
      setDecryptedMnemonic(dec);
    } catch (error) {
      toast.error("Failed to decrypt mnemonic: incorrect password");
    } finally {
      setLoading(false);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!csrf) {
      throw new Error("No CSRF token");
    }

    try {
      await request("/api/mnemonic", {
        method: "PATCH",
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
      });
      navigate("/");
      toast.success("Mnemonic Backed Up!");
    } catch (error) {
      handleRequestError("Failed to store back up info", error);
    }
  }

  return (
    <>
      {!decryptedMnemonic ? (
        <Container>
          <p className="font-light text-center text-md leading-relaxed dark:text-neutral-400 mb-14">
            Enter your password to decrypt mnemonic
          </p>
          <form onSubmit={onSubmitPassword} className="w-full">
            <>
              <Input
                name="unlock"
                onChange={(e) => setUnlockPassword(e.target.value)}
                value={unlockPassword}
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                endAdornment={
                  <PasswordViewAdornment
                    onChange={(passwordView) => {
                      setPasswordVisible(passwordView);
                    }}
                  />
                }
              />
              <ConnectButton isConnecting={loading} />
            </>
          </form>
        </Container>
      ) : (
        <form
          onSubmit={onSubmit}
          className="flex mt-6 flex-col gap-2 mx-auto max-w-2xl text-sm"
        >
          <h1 className="font-semibold text-2xl font-headline mb-2 dark:text-white">
            Back up your wallet
          </h1>

          <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-2 items-center">
              <div className="shrink-0 text-gray-600 dark:text-neutral-400">
                <PopiconsLifebuoyLine className="w-6 h-6" />
              </div>
              <span className="text-gray-600 dark:text-neutral-400">
                Your recovery phrase is a set of 12 words that{" "}
                <b>backs up your wallet</b>
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="shrink-0 text-gray-600 dark:text-neutral-400">
                <PopiconsShieldLine className="w-6 h-6" />
              </div>
              <span className="text-gray-600 dark:text-neutral-400">
                Make sure to write them down somewhere safe and private
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="shrink-0 text-red-600 dark:text-red-800">
                <PopiconsTriangleExclamationLine className="w-6 h-6" />
              </div>
              <span className="font-medium text-red-600 dark:text-red-800">
                If you lose your recovery phrase, you will lose access to your
                funds
              </span>
            </div>
          </div>

          <MnemonicInputs mnemonic={decryptedMnemonic} readOnly={true}>
            <div className="flex items-center">
              <input
                id="checkbox"
                type="checkbox"
                onChange={(event) => {
                  isBackedUp(event.target.checked);
                }}
                checked={backedUp}
                className="w-4 h-4 text-purple-700 bg-gray-100 border-gray-300 rounded focus:ring-purple-700 dark:focus:ring-purple-800 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="checkbox"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                I've backed my recovery phrase to my wallet in a private and
                secure place
              </label>
            </div>
          </MnemonicInputs>
          <ConnectButton
            submitText="Finish"
            loadingText="Saving..."
            isConnecting={false}
            disabled={!backedUp}
          />
        </form>
      )}
    </>
  );
}