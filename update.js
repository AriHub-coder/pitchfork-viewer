const fs = require("fs");

async function fetchText(url) {
  const res = await fetch(url);
  return await res.text();
}

function clean(text) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function run() {
  let items = [];

  // 1. encontrar última nota
  const tagHtml = await fetchText("https://pitchfork.com/tags/pitchfork-selects/");
  const match = tagHtml.match(/href="(\/news\/[^"]+pitchfork-selects[^"]+)"/i);

  if (!match) {
    throw new Error("No encontré la nota");
  }

  const articleUrl = "https://pitchfork.com" + match[1];

  // 2. bajar artículo
  const html = await fetchText(articleUrl);

  // 3. buscar patrones tipo "Artist: Track" dentro del contenido
  const possible = html.match(/>([^<]{3,100}?)\s[–-]\s([^<]{3,150}?)</g) || [];

  for (let line of possible) {
    const cleanLine = clean(line);

    const parts = cleanLine.split(/\s[–-]\s/);

    if (parts.length === 2) {
      const artist = parts[0];
      const track = parts[1];

      // filtro básico para evitar basura
      if (
        artist.length < 80 &&
        track.length < 120 &&
        !artist.includes("Pitchfork")
      ) {
        items.push({ artist, track });
      }
    }
  }

  // eliminar duplicados
  const unique = [];
  const seen = new Set();

  for (let item of items) {
    const key = item.artist + item.track;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  items = unique.slice(0, 20);

  if (items.length === 0) {
    throw new Error("No pude extraer tracks reales");
  }

  // 4. enrich con Apple
  const results = [];

  for (let item of items) {
    try {
      const query = encodeURIComponent(item.artist + " " + item.track);
      const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

      const res = await fetch(url);
      const json = await res.json();
      const r = json.results[0];

      if (r) {
        results.push({
          artist: r.artistName,
          track: r.trackName,
          album: r.collectionName,
          cover_url: r.artworkUrl100.replace("100x100", "1200x1200"),
          track_url: r.trackViewUrl
        });
      }
    } catch {}
  }

  const data = {
    week_of: new Date().toISOString().slice(0, 10),
    source_article: "Pitchfork Selects",
    source_url: articleUrl,
    playlist_name: "Pitchfork Selects",
    items: results
  };

  if (!fs.existsSync("data")) fs.mkdirSync("data");

  fs.writeFileSync("data/latest.json", JSON.stringify(data, null, 2));

  console.log("DONE:", results.length, "tracks");
}

run();
