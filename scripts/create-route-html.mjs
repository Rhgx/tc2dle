import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");
const siteUrl = "https://rhgx.github.io/tc2dle";
const routes = ["weapons", "maps", "cosmetics"];

const indexHtml = await readFile(indexPath, "utf8");

for (const route of routes) {
  const routeDir = path.join(distDir, route);
  await mkdir(routeDir, { recursive: true });
  await writeFile(path.join(routeDir, "index.html"), withRouteUrl(indexHtml, route));
}

await writeFile(path.join(distDir, "404.html"), indexHtml);

function withRouteUrl(html, route) {
  const routeUrl = `${siteUrl}/${route}/`;
  return html
    .replace(
      /<meta property="og:url" content="[^"]*" \/>/,
      `<meta property="og:url" content="${routeUrl}" />`,
    )
    .replace(
      /<meta name="twitter:url" content="[^"]*" \/>/,
      `<meta name="twitter:url" content="${routeUrl}" />`,
    );
}
