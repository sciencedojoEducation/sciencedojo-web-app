// Extract one decorative scene still per official episode; no full videos are retained.
import { spawn } from 'node:child_process';
import { mkdir, access, writeFile } from 'node:fs/promises';
import { nicosWegA1Episodes } from '../lib/nicos-weg-a1-episodes.ts';

const ffmpeg = process.env.NICOS_BANNER_FFMPEG;
if (!ffmpeg) throw new Error('Set NICOS_BANNER_FFMPEG to a full FFmpeg binary.');
const directory = new URL('../public/images/academy/nicos-weg-a1/episodes/', import.meta.url);
await mkdir(directory, { recursive: true });
const selected = process.argv.includes('--sample') ? nicosWegA1Episodes.slice(0, 2) : nicosWegA1Episodes;
const failures = [];
let cursor = 0;
async function worker() {
  while (cursor < selected.length) {
    const episode = selected[cursor++];
    const filename = `${String(episode.episode).padStart(2, '0')}.jpg`;
    const output = new URL(filename, directory);
    try { await access(output); continue; } catch {}
    const url = `https://hlsvod.dw.com/i/Events/mp4/nicosweg/A1_E${episode.unit}_L${episode.part}_F${episode.episode}_,sd,hd,.mp4.csmil/master.m3u8`;
    const result = await new Promise(resolve => {
      const child = spawn(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-rw_timeout', '15000000', '-ss', '30', '-i', url, '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '4', output.pathname]);
      let error = '';
      child.stderr.on('data', data => { error += data; });
      const timer = setTimeout(() => child.kill(), 60000);
      child.on('close', code => { clearTimeout(timer); resolve({ code, error }); });
    });
    if (result.code !== 0) failures.push({ episode: episode.episode, error: result.error.trim() });
    console.log(`${filename}: ${result.code === 0 ? episode.title : 'FAILED'}`);
  }
}
await Promise.all([worker(), worker(), worker()]);
if (failures.length) { console.error(JSON.stringify(failures)); process.exitCode = 1; }
else if (!process.argv.includes('--sample')) await writeFile(new URL('sources.json', directory), JSON.stringify(nicosWegA1Episodes.map(e => ({ episode: e.episode, title: e.title, script: e.url, video: `https://hlsvod.dw.com/i/Events/mp4/nicosweg/A1_E${e.unit}_L${e.part}_F${e.episode}_,sd,hd,.mp4.csmil/master.m3u8`, seconds: 30, copyright: 'Deutsche Welle' })), null, 2) + '\n');
