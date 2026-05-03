import { dateKey } from "./date";
import { hashString } from "./hash";

export function pickDailyLoadingScreen(urls: string[]) {
  if (!urls.length) return "";
  return urls[hashString(`${dateKey()}-tc2-loading-screen`) % urls.length];
}
