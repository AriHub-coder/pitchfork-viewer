const fs = require("fs");

async function fetchText(url) {
  const res = await fetch(url);
  return await res.text();
}

async function run() {
  const tagPage = await fetchText("https://pitchfork.com/tags/pitchfork-selects/");

  const match = tagPage.match(/href="(\/news\/[^"]+pitchfork-selects[^"]+)"/i);
  const articleUrl = "https://pitchfork.com" + match[1];

  const article = await fetchText(articleUrl);

  const regex = /<li>(.*?)<\/li>/g;
  let items = [];
  let m;

  while ((m = regex.exec(article))) {
    const text = m[1].replace(/<[^>]+>/g, "").trim();

    if (text.includes("–") || text.includes("-")) {
      const [artist, track] = text.split(/–|-/).map(s => s.trim());

      items.push({ artist, track });
    }
  }

  const results = [];

  for (let item of items.slice(0, 20)) {
    const query = encodeURIComponent(item.artist + " " + item.track);
    const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

    try {
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
    } catch (e) {}
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

  console.log("updated real data");
}

run();
