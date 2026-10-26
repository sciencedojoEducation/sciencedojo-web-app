"""Prepare the owner's scanned Intensivtrainer locally; never upload source pages.

Use bundled Python (Pillow). First render with pdftoppm and run
scripts/ocr-workbook.swift on the derived directory. All source/crops/OCR/content
are gitignored. The reviewed boundaries below contain coordinates, not book text.
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / 'private-materials/aspekte-neu-b2-intensivtrainer/derived'
TITLES = ['Heimat ist …', 'Sprich mit mir!', 'Arbeit ist das halbe Leben?', 'Zusammen leben',
          'Wer Wissen schafft, macht Wissenschaft', 'Fit für …', 'Kulturwelten',
          'Das macht(e) Geschichte', 'Mit viel Gefühl …', 'Ein Blick in die Zukunft']
INSTRUCTION = re.compile(r'(Ergänzen|Ordnen|Schreiben|Kombinieren|Finden|Bilden|Markieren|Kreuzen|Was |Welche|Welches|Wer |Wie |Woran|Wofür|Notieren|Unterstreichen|Formulieren|Variieren|Suchen|Streichen|Lesen|Reagieren|Übernehmen|Bestimmen|Verbinden|Verwenden|Nennen|Entscheiden|Setzen|Sortieren|Mein Text|Wörter und Sätze|Wichtige Ausdrücke|Gegenteil|Korrigieren)', re.I)
# Source-image reviewed exercise starts that OCR misses or mistakes for body text.
ADD = {5:[('4',.311)],9:[('13c',.383),('14',.592)],13:[('5',.418)],15:[('11b',.370)],
       20:[('1a',.099)],28:[('1b',.412)],30:[('6a',.102)],31:[('7a',.094)],38:[('9a',.488)],
       45:[('3a',.112)],46:[('7a',.105)],49:[('12a',.092)],53:[('5',.346)],56:[('13a',.647)],
       61:[('4',.104)],62:[('9',.481)],64:[('12',.105),('13b',.787)],73:[('16a',.405)],
       77:[('6',.425)],78:[('9',.292)],80:[('12c',.097)]}
REMOVE = {24:[.289],38:[.741],78:[.765]}
# First chapter's response structure checked against the actual source pages.
FIELD_COUNTS = {'4:1a':5,'4:1b':6,'4:2a':1,'4:2b':5,'5:3':8,'5:4':8,'5:5':9,'5:6':4,
                '6:7a':10,'6:7b':6,'6:7c':3,'6:8':6,'6:9a':4,'6:9b':1,
                '7:10a':15,'7:10b':1,'7:10c':1,'7:10d':18,'8:10e':6,'8:10f':6,
                '8:11':1,'8:12':11,'9:13a':4,'9:13b':10,'9:13c':6,'9:14':8}


def read_rows(n):
    return json.loads((BASE / f'page-{n:02}.json').read_text())


def headings(rows, book):
    out=[]
    for r in rows:
        text=r['text']; x=r['x']; y=r['y']
        if not .07<y<.945 or x>.23: continue
        cleaned=re.sub(r'^(?:Auftakt\s*|[Mm]?[Oo]?dul[e]?\s+\d(?:\+\d)?\s*)','',text)
        m=re.match(r'^(\d{1,2}[a-f]?|[a-f]|la|lb)\s+([A-ZÄÖÜ].*)',cleaned)
        number=None
        if m and INSTRUCTION.search(m[2]): number=m[1]
        elif re.fullmatch(r'\d{1,2}[a-f]?|la|lb',cleaned):
            peers=[v for v in rows if abs(v['y']-y)<.023 and x+.012<v['x']<.3 and len(v['text'])>18 and INSTRUCTION.search(v['text'])]
            if peers:
                number=cleaned
                y=min(y,min(v['y'] for v in peers))
        if number:
            number={'la':'1a','lb':'1b'}.get(number,number)
            out.append({'id':number,'y':max(.065,y-.008)})
    out=[h for h in out if not any(abs(h['y']-bad)<.015 for bad in REMOVE.get(book,[]))]
    for number,y in ADD.get(book,[]):
        out=[h for h in out if abs(h['y']-y)>.018]
        out.append({'id':number,'y':y})
    return sorted(out,key=lambda h:h['y'])


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pdf',type=Path)
    parser.add_argument('--ocr',action='store_true')
    args=parser.parse_args()
    BASE.mkdir(parents=True,exist_ok=True)
    if args.pdf:
        subprocess.run(['pdftoppm','-f','1','-l','81','-jpeg','-jpegopt','quality=86','-scale-to','1700',str(args.pdf),str(BASE/'page')],check=True)
        (BASE/'source-sha256.txt').write_text(hashlib.sha256(args.pdf.read_bytes()).hexdigest())
    if args.ocr:
        subprocess.run(['swift','-module-cache-path','/private/tmp/intensivtrainer-swift-cache',str(ROOT/'scripts/ocr-workbook.swift'),str(BASE)],check=True)
    for folder in ['assets','content']: (BASE/folder).mkdir(exist_ok=True)
    pages=[]; parent=0; chapter=0
    for book in range(4,84):
        current=(book-4)//8+1
        if current!=chapter: parent=0; chapter=current
        n=None if book==43 else book-1 if book<43 else book-2
        status='missing' if n is None else 'damaged' if book in [39,40,41,42] else 'ready'
        warning='Diese Seite fehlt im gelieferten Scan.' if n is None else 'Der Scan ist auf dieser Seite beschädigt. Fehlender Text wurde nicht ergänzt.' if status=='damaged' else ''
        page={'number':book,'pdfPage':n,'section':'Übungen','status':status,'warning':warning,'exercises':[],'words':[]}
        pages.append(page)
        if n is None: continue
        source=Image.open(BASE/f'page-{n:02}.jpg').convert('RGB');w,h=source.size
        shutil.copyfile(BASE/f'page-{n:02}.jpg',BASE/'assets'/f'page-{n:02}.jpg')
        rows=read_rows(n)
        vocabulary='Wortschatz-Hitparade' in ' '.join(r['text'] for r in rows[:4]) or book==42
        if vocabulary:
            page['section']='Wortschatz-Hitparade'
            for column in [0,1]:
                category='Wortschatz'
                for r in sorted([r for r in rows if .10<r['y']<.94 and (r['x']<.5)==(column==0)],key=lambda r:r['y']):
                    text=r['text'].strip()
                    if text in ['Nomen','Verben','Adjektive','Andere Wörter']: category=text;continue
                    if len(text)<2 or text.isdigit() or 'Hitparade' in text: continue
                    page['words'].append({'id':f'w{len(page["words"])+1}','text':text,'category':category})
            continue
        if status=='damaged': continue
        hs=headings(rows,book)
        if not hs: raise ValueError(f'No exercise boundaries on page {book}')
        for i,item in enumerate(hs):
            number=item['id']
            if number.isalpha(): number=f'{parent}{number}'
            else: parent=int(re.match(r'\d+',number)[0])
            top=item['y'];bottom=hs[i+1]['y'] if i+1<len(hs) else .942
            lines=sorted([r for r in rows if top<=r['y']<bottom-.002],key=lambda r:(round(r['y']/.012),r['x']))
            # The page crop is the fidelity reference. OCR is an optional accessible draft.
            transcript='\n'.join(r['text'] for r in lines)
            titlelines=[r['text'] for r in lines if r['y']<top+.055 and len(r['text'])>20]
            title=' '.join(titlelines[:2]) or next((r['text'] for r in lines if len(r['text'])>20), f'Übung {number}')
            title=re.sub(r'^(?:Auftakt\s*|Modul[e]?\s+\d(?:\+\d)?\s*)','',title)
            title=re.sub(r'^(?:\d{1,2}[a-fа]?|[a-f])\s+','',title)
            # Keep the task header concise; the complete original instruction is in its crop.
            title=title[:240]
            writing=bool(re.search(r'Mein Text|Schreiben Sie (?:einen|eine|für|fünf|vier)|Ihre Sprache|wichtig finden|Woran denken|Mindmap|Meinung|Sätze um|Text um|Korrigieren|Unterstreichen|Markieren',title,re.I))
            numbered=[int(v) for v in re.findall(r'(?:\((\d{1,2})\)|(?<!\w)(\d{1,2})\.\s)',transcript) for v in v if v and 0<int(v)<=30]
            count=1 if writing else min(30,max(numbered,default=1))
            count=FIELD_COUNTS.get(f'{book}:{number}',count)
            asset=f'task-{book}-{number}'
            source.crop((int(w*.015),max(0,int(h*top)),int(w*.97),min(h,int(h*bottom)))).save(BASE/'assets'/f'{asset}.jpg',quality=88)
            fields=[{'id':str(k+1),'label':str(k+1),'multiline':writing or count==1} for k in range(count)]
            if f'{book}:{number}'=='4:1a':
                for field,label in zip(fields,['sehen','riechen','hören','schmecken','spüren / fühlen']):field.update(label=label,multiline=True)
            page['exercises'].append({'id':number,'title':title,'asset':asset,'transcript':transcript,'fields':fields,'writing':writing,'sourceDependent':bool(re.search(r'Lehrbuch',transcript))})
        assert len({e['id'] for e in page['exercises']})==len(page['exercises']),(book,[e['id'] for e in page['exercises']])
    for page in pages:(BASE/'content'/f'{page["number"]}.json').write_text(json.dumps(page,ensure_ascii=False,indent=2))
    manifest={'title':'Aspekte neu B2 · Intensivtrainer','chapters':[{'number':i+1,'title':title,'firstPage':4+i*8,'lastPage':11+i*8} for i,title in enumerate(TITLES)],'pages':[{k:v for k,v in page.items() if k not in ['exercises','words']} for page in pages], 'exerciseCount':sum(len(p['exercises']) for p in pages),'wordCount':sum(len(p['words']) for p in pages),'sourceNotice':'Lösungen ab Seite 84 sind im gelieferten PDF nicht lesbar enthalten. Selbstkontrolle ohne automatische Bewertung. Seiten 39–42 sind beschädigt; Seite 43 fehlt.'}
    (BASE/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    print(json.dumps({'pages':len(pages),'exercises':manifest['exerciseCount'],'words':manifest['wordCount'],'responseFields':sum(len(e['fields']) for p in pages for e in p['exercises']),'damaged':[p['number'] for p in pages if p['status']=='damaged'],'missing':[p['number'] for p in pages if p['status']=='missing']}))

if __name__=='__main__':main()
