"""Create private AAC streaming copies with macOS AudioToolbox; originals stay intact."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json,subprocess,sys,shutil
if Path("/private/tmp/aspekte-media-tools").exists():sys.path.insert(0,"/private/tmp/aspekte-media-tools")
try:
 import imageio_ffmpeg
 FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
 FFMPEG=shutil.which("ffmpeg")
if not FFMPEG:raise SystemExit("FFmpeg is required to encode private streaming copies")
root=Path(__file__).resolve().parent.parent/'private-materials/aspekte-neu-b2/derived'
def convert(n):
 target=root/'audio'/f'{n:02}.m4a'
 if not target.exists():subprocess.run([FFMPEG,'-v','error','-y','-i',str(root/'audio'/f'{n:02}.wav'),'-c:a','aac','-b:a','96k','-movflags','+faststart',str(target)],check=True)
 return n,target.stat().st_size
if __name__=='__main__':
 with ThreadPoolExecutor(max_workers=3) as pool: sizes=dict(pool.map(convert,range(1,52)))
 manifest=json.loads((root/'manifest.json').read_text())
 for track in manifest['tracks']:track.update(streamingBytes=sizes[track['number']],streamingFormat='m4a')
 for chapter in manifest['chapters']:
  pages=[json.loads((root/'content'/f'{n:03}.json').read_text()) for n in range(chapter['firstPage'],chapter['lastPage']+1)]
  chapter.update(readyPages=len(pages),nativePages=sum(bool(p.get('nativeContentVersion')) for p in pages),totalFields=sum(len(e['fields']) for p in pages for e in p['exercises']))
 manifest['runtimePreparedVersion']=2
 (root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'tracks':len(sizes),'streamingBytes':sum(sizes.values())}))
