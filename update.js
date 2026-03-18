const fs = require("fs");

async function run() {
  const data = {
    week_of: new Date().toISOString().slice(0, 10),
    source_article: "Pitchfork Selects",
    source_url: "https://pitchfork.com",
    playlist_name: "Pitchfork Selects",
    items: [
      {
        artist: "Test Artist",
        track: "Test Track",
        album: "Test Album",
        cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/3a/56/52/3a5652e7-6c2d-7a3c-b4f3-88b5881f509c/191401212726.png/1200x1200bb.jpg",
        track_url: "https://music.apple.com"
      }
    ]
  };

  if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
  }

  fs.writeFileSync("data/latest.json", JSON.stringify(data, null, 2));

  console.log("OK");
}

run();
