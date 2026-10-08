import { nicosWegA2Episodes } from "../lib/nicos-weg-a2-episodes.ts";
import { nicosWegB1Episodes } from "../lib/nicos-weg-b1-episodes.ts";
const episodes = [...nicosWegA2Episodes,...nicosWegB1Episodes];
const failures=[];
let index=0, verified=0;
async function read(url) {
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}
await Promise.all(Array.from({length:6},async () => {
  while(index<episodes.length) {
    const episode=episodes[index++];
    try {
      const manifest=await read(episode.video);
      if (!manifest.startsWith("#EXTM3U")) throw new Error("Invalid master manifest");
      const variant=manifest.split(/\r?\n/).find(line => line.trim()&&!line.startsWith("#"));
      if (!variant) throw new Error("No video variant");
      const playlist=await read(new URL(variant,episode.video));
      if (!playlist.includes("#EXTINF") || !playlist.includes("#EXT-X-ENDLIST")) throw new Error("Incomplete media playlist");
      const seconds=[...playlist.matchAll(/#EXTINF:([\d.]+)/g)].reduce((sum,m) => sum+Number(m[1]),0);
      if (seconds<20) throw new Error(`Incomplete clip: ${seconds} seconds`);
      verified++;
    } catch(error) { failures.push({title:episode.videoTitle,url:episode.video,error:error.message}); }
  }
}));
console.log(JSON.stringify({verified,total:episodes.length,failures},null,2));
if (failures.length) process.exitCode=1;
