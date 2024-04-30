import { Link } from "react-router-dom";
import { openBrowser } from "src/utils/openBrowser";

type Props = {
  to: string;
  className?: string;
  children?: React.ReactNode;
};

export default function ExternalLink({ to, className, children }: Props) {
  const isHttpMode = window.location.protocol.startsWith("http");

  return isHttpMode ? (
    <Link
      to={to}
      target="_blank"
      rel="noreferer noopener"
      className={className}
    >
      {children}
    </Link>
  ) : (
    <div className={className} onClick={() => openBrowser(to)}>
      {children}
    </div>
  );
}
