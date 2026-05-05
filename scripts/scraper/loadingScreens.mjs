import { isStaticBackgroundUrl, normalizeImageUrl } from "./assets.mjs";

const LOADING_SCREENS_CATEGORY_API =
  "https://typicalcolors2.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Loading_screens&cmtype=file&cmlimit=max&format=json&origin=*";

export async function scrapeLoadingScreensFromWiki() {
  const categoryResponse = await fetch(LOADING_SCREENS_CATEGORY_API);
  if (!categoryResponse.ok) throw new Error(`Loading screens category request failed with ${categoryResponse.status}`);

  const categoryJson = await categoryResponse.json();
  const members = categoryJson?.query?.categorymembers || [];
  const titles = members.map((member) => member.title).filter(Boolean);
  if (!titles.length) return [];

  const imageInfoUrl =
    "https://typicalcolors2.fandom.com/api.php?action=query&prop=imageinfo&iiprop=url&format=json&origin=*&titles=" +
    encodeURIComponent(titles.join("|"));
  const imageResponse = await fetch(imageInfoUrl);
  if (!imageResponse.ok) throw new Error(`Loading screen image request failed with ${imageResponse.status}`);

  const imageJson = await imageResponse.json();
  const pages = Object.values(imageJson?.query?.pages || {});
  return pages
    .map((page) => normalizeImageUrl(page?.imageinfo?.[0]?.url || ""))
    .filter(isStaticBackgroundUrl)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}
