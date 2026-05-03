export function resolveAssetUrl(url: string) {
  if (!url || /^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  return `${import.meta.env.BASE_URL}${url.replace(/^\/+/, "")}`;
}
