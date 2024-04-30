import React from "react";
import { useNavigate } from "react-router-dom";

import Container from "src/components/Container";
import Loading from "src/components/Loading";
import TwoColumnLayoutHeader from "src/components/TwoColumnLayoutHeader";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { toast } from "src/components/ui/use-toast";
import { useCSRF } from "src/hooks/useCSRF";
import { useInfo } from "src/hooks/useInfo";
import { handleRequestError } from "src/utils/handleRequestError";
import { openBrowser } from "src/utils/openBrowser"; // build the project for this to appear
import { request } from "src/utils/request"; // build the project for this to appear

export default function AlbyAuthRedirect() {
  const navigate = useNavigate();
  const { data: csrf } = useCSRF();
  const { data: info, mutate: refetchInfo } = useInfo();

  const [authCode, setAuthCode] = React.useState("");
  const [isOpened, setIsOpened] = React.useState(false);

  React.useEffect(() => {
    if (!info) {
      return;
    }
    if (info.oauthRedirect) {
      window.location.href = info.albyAuthUrl;
    } else {
      setIsOpened((isOpened) => {
        if (!isOpened) {
          // open in new tab if http protocol
          if (window.location.protocol.startsWith("http"))
            window.open(info.albyAuthUrl, "_blank");
          else openBrowser(info.albyAuthUrl);
        }
        return true;
      });
    }
  }, [info, isOpened]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!csrf) {
        throw new Error("info not loaded");
      }
      await request(`/api/alby/callback?code=${authCode}`, {
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
      });
      await refetchInfo();
      navigate("/");
    } catch (error) {
      handleRequestError(toast, "Failed to connect", error);
    }
  }

  return !info || info.oauthRedirect ? (
    <Loading />
  ) : (
    <>
      <Container>
        <form onSubmit={onSubmit} className="flex flex-col items-center w-full">
          <div className="grid gap-5">
            <TwoColumnLayoutHeader
              title="Alby OAuth"
              description="Enter your Auth Code to connect to Alby"
            />
            <div className="grid gap-4 w-full">
              <div className="grid gap-1.5">
                <Label htmlFor="unlock-password">Authorization Code</Label>
                <Input
                  type="text"
                  name="authorization-code"
                  id="authorization-code"
                  placeholder="Enter code you see in the browser"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  required={true}
                />
              </div>
            </div>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Container>
    </>
  );
}
