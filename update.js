const fs = require("fs");

async function run() {
  let items = [];

  try {
    const res = await fetch("https://pitchfork.com/tags/pitchfork-selects/");
    const html = await res.text();

    const match = html.match(/href="(\/news\/[^"]+pitchfork-selects[^"]+)"/i);
    const articleUrl = "https://pitchfork.com" + match[1];

    const res2 = await fetch(articleUrl);
    const article = await res2.text();

    const regex = /<li>(.*?)<\/li>/g;
    let m;

    while ((m = regex.exec(article))) {
      const text = m[1].replace(/<[^>]+>/g, "").trim();

      if (text.includes("–") || text.includes("-")) {
        const [artist, track] = text.split(/–|-/).map(s => s.trim());
        items.push({ artist, track });
      }
    }

  } catch (e) {
    console.log("Pitchfork fail, fallback mode");
  }

  // 🔥 fallback si no encontró nada
  if (items.length === 0) {
    items = [
      { artist: "Rosalía", track: "Saoko" },
      { artist: "Frank Ocean", track: "Nights" },
      { artist: "Tame Impala", track: "The Less I Know The Better" }
    ];
  }

  const results = [];

  for (let item of items.slice(0, 20)) {
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
    source_url: "https://pitchfork.com",
    playlist_name: "Pitchfork Selects",
    items: results
  };

  if (!fs.existsSync("data")) fs.mkdirSync("data");

  fs.writeFileSync("data/latest.json", JSON.stringify(data, null, 2));

  console.log("DONE", results.length);
}

run();
