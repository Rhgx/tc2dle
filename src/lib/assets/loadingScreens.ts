import { hashString } from "../game/hash";
import { dateKey } from "../time/date";

export function pickDailyLoadingScreen(urls: string[]) {
  if (!urls.length) return "";
  return urls[hashString(`${dateKey()}-tc2-loading-screen`) % urls.length];
}
