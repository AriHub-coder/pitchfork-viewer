const fs = require("fs/promises");
const path = require("path");

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 PitchforkSelectsViewer/1.0"
    }
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

function decodeHtml(str = "") {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

async function getLatestArticle() {
  const tagUrl = "https://pitchfork.com/tags/pitchfork-selects/";
  const html = await fetchText(tagUrl);

  const patterns = [
    /href="(\/news\/[^"]+this-weeks-pitchfork-selects-playlist\/?)"/i,
    /href="(\/news\/[^"]+pitchfork-selects[^"]*\/?)"/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return {
        sourceTagUrl: tagUrl,
        articleUrl: "https://pitchfork.com" + match[1]
      };
    }
  }

  throw new Error("No pude encontrar la nota más reciente de Pitchfork Selects.");
}

function extractItemsFromArticle(html) {
  const items = [];

  const liMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  for (const match of liMatches) {
    const raw = decodeHtml(
      match[1]
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    );

    const clean = raw
      .replace(/^Listen to /i, "")
      .replace(/^Stream /i, "")
      .trim();

    const parts = clean.split(/\s[–—-]\s/);
    if (parts.length >= 2) {
      const artist = parts[0].trim();
      const track = parts.slice(1).join(" - ").trim();

      if (artist && track && artist.length < 120 && track.length < 200) {
        items.push({ artist, track });
      }
    }
  }

  const uniq = [];
  const seen = new Set();
  for (const item of items) {
    const key = `${item.artist}__${item.track}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(item);
    }
  }

  return uniq;
}

async function enrichWithApple(items) {
  const enriched = [];

  for (const item of items) {
    const term = encodeURIComponent(`${item.artist} ${item.track}`);
    const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=5`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      const pick = (json.results || []).find(r =>
        (r.artistName || "").toLowerCase().includes(item.artist.toLowerCase().slice(0, 6))
      ) || json.results?.[0];

      if (pick) {
        enriched.push({
          artist: pick.artistName || item.artist,
          track: pick.trackName || item.track,
          album: pick.collectionName || "",
          cover_url: (pick.artworkUrl100 || "").replace(/100x100/g, "1200x1200"),
          track_url: pick.trackViewUrl || "",
          collection_url: pick.collectionViewUrl || ""
        });
      } else {
        enriched.push({
          artist: item.artist,
          track: item.track,
          album: "",
          cover_url: "",
          track_url: "",
          collection_url: ""
        });
      }
    } catch {
      enriched.push({
        artist: item.artist,
        track: item.track,
        album: "",
        cover_url: "",
        track_url: "",
        collection_url: ""
      });
    }
  }

  return enriched;
}

(async () => {
  const { articleUrl } = await getLatestArticle();
  const articleHtml = await fetchText(articleUrl);
  const rawItems = extractItemsFromArticle(articleHtml);

  if (!rawItems.length) {
    throw new Error("No pude extraer tracks de la nota.");
  }

  const items = await enrichWithApple(rawItems);

  const payload = {
    week_of: new Date().toISOString().slice(0, 10),
    source_article: "Pitchfork Selects",
    source_url: articleUrl,
    playlist_name: "Pitchfork Selects",
    items
  };

  await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(
    path.join(process.cwd(), "data", "latest.json"),
    JSON.stringify(payload, null, 2),
    "utf8"
  );

  console.log(`Updated ${items.length} items from ${articleUrl}`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
