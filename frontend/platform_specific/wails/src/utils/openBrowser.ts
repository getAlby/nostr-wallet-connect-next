import { BrowserOpenURL } from "wailsjs/runtime/runtime";

export const openLink = (url: string) => {
  try {
    BrowserOpenURL(url);
  } catch (error) {
    console.error("Failed to open link", error);
    throw error;
  }
};
