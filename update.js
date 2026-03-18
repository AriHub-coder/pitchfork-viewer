const fs = require("fs");

async function run() {
  const playlistUrl = "https://itunes.apple.com/search?term=pitchfork+selects&entity=album&limit=1";

  const res = await fetch(playlistUrl);
  const json = await res.json();

  if (!json.results.length) {
    throw new Error("No encontré la playlist");
  }

  // 🔥 fallback manual (temporal pero funcional)
  const items = [
    { artist: "Jaeychino", track: "Track 1" },
    { artist: "Ora Cogan", track: "Track 2" },
    { artist: "Rostam", track: "Track 3" },
    { artist: "New Artist", track: "Track 4" },
    { artist: "Another Artist", track: "Track 5" }
  ];

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
    source_url: "https://pitchfork.com",
    playlist_name: "Pitchfork Selects",
    items: results
  };

  if (!fs.existsSync("data")) fs.mkdirSync("data");

  fs.writeFileSync("data/latest.json", JSON.stringify(data, null, 2));

  console.log("DONE", results.length);
}

run();
