import toast from "src/components/Toast";
import { ErrorResponse } from "src/types";

import { WailsRequestRouter } from "wailsjs/go/main/WailsApp";

export const request = async <T>(
  ...args: Parameters<typeof fetch>
): Promise<T | undefined> => {
  try {
    const appType = import.meta.env.VITE_NWC_APP_TYPE || "HTTP";
    // TODO: can we use a different request file at build time so no conditional / env variable is needed?
    switch (appType) {
      case "WAILS": {
        const res = await WailsRequestRouter(
          args[0].toString(),
          args[1]?.method || "GET",
          args[1]?.body?.toString() || ""
        );

        console.log("Wails request", ...args, res);
        if (res.error) {
          throw new Error(res.error);
        }

        return res.body;
      }
      case "HTTP": {
        const fetchResponse = await fetch(...args);

        let body: T | undefined;
        try {
          body = await fetchResponse.json();
        } catch (error) {
          console.error(error);
        }

        if (!fetchResponse.ok) {
          throw new Error(
            fetchResponse.status +
              " " +
              ((body as ErrorResponse)?.message || "Unknown error")
          );
        }
        return body;
      }
      default:
        throw new Error("Unsupported app type: " + appType);
    }
  } catch (error) {
    console.error("Failed to fetch", error);
    throw error;
  }
};

export function handleRequestError(message: string, error: unknown) {
  console.error(message, error);
  toast.error(message + ": " + error);
}