import React from "react";
import AuthCodeForm from "src/components/AuthCodeForm";

import Loading from "src/components/Loading";
import { useInfo } from "src/hooks/useInfo";
import { openLink } from "src/utils/openLink"; // build the project for this to appear

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
        if (!isOpened) openLink(info.albyAuthUrl);
        return true;
      });
    }
  }, [info, isOpened]);

  return !info || info.oauthRedirect ? <Loading /> : <AuthCodeForm />;
}
