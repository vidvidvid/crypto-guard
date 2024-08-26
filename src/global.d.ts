import { Chrome } from "chrome";

declare global {
  interface Window {
    chrome: Chrome;
  }
}
