import { BrowserOpenURL } from "wailsjs/runtime/runtime";

export const openBrowser = (url: string) => {
  try {
    BrowserOpenURL(url);
  } catch (error) {
    console.error("Failed to open link", error);
    throw error;
  }
};
