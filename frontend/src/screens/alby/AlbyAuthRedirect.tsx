import React from "react";
import AuthCodeForm from "src/components/AuthCodeForm";

import Loading from "src/components/Loading";
import { useInfo } from "src/hooks/useInfo";
import { openBrowser } from "src/utils/openBrowser"; // build the project for this to appear

export default function AlbyAuthRedirect() {
  const { data: info } = useInfo();

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

  return !info || info.oauthRedirect ? <Loading /> : <AuthCodeForm />;
}
