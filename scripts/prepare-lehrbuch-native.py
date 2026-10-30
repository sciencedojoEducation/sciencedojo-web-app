"""Rebuild the owner's private Lehrbuch from local word-position OCR.

Source text, image crops, authoring overrides and output remain in private-materials.
No external OCR/model requests. Run ocr-lehrbuch.swift before this script.
"""
import argparse, hashlib, json, re, uuid
from pathlib import Path
from collections import deque
import numpy as np
from PIL import Image, ImageFilter
from pypdf import PdfReader

ROOT = Path.cwd()
TITLES = ['Heimat ist …','Sprich mit mir!','Arbeit ist das halbe Leben?','Zusammen leben','Wer Wissen schafft, macht Wissenschaft','Fit für …','Kulturwelten','Das macht(e) Geschichte','Mit viel Gefühl …','Ein Blick in die Zukunft']
ACTION = re.compile(r'\b(?:Lesen|Hören|Sehen|Sprechen|Schreiben|Ordnen|Ergänzen|Kreuzen|Markieren|Unterstreichen|Notieren|Sammeln|Vergleichen|Arbeiten|Diskutieren|Berichten|Überlegen|Formulieren|Finden|Wählen|Nennen|Erklären|Beschreiben|Beantworten|Stellen|Verneinen|Präsentieren|Suchen|Verbinden|Üben|Kennen|Erzählen|Entscheiden|Achten|Spielen|Bilden|Was|Wie|Welche|Welcher|Welches|Wer|Wann|Wo|Woran|Wofür|Warum|Womit|Worüber|Jeder|Jemand)\b', re.I)
MARK = re.compile(r'^([0-9]{1,2}[a-h]?|[a-h]|la|lb|lc|ld)\s+(.+)')
ITEM = re.compile(r'^(\d{1,2})[.)]\s+(.+)')
MEDIA = re.compile(r'\b(?:hören|hören Sie|Film|Video|Szene|sehen Sie.*Film)\b', re.I)
WRITING = re.compile(r'(?:Schreiben Sie (?:einen|eine|an|für)|verfassen|Forumsbeitrag|Bewerbungsschreiben|Beschwerdebrief|Kommentar|Leserbrief|E-Mail)',re.I)
FILL = re.compile(r'ergänzen|ordnen|verbinden|ausfüllen|einsetzen|notieren|kreuzen|verneinen|bilden|umformen',re.I)

def clean(s):
    return re.sub(r'\s+',' ',s.replace('\u00ad','').replace('\u0000','')).strip()
def norm(s): return re.sub(r'[^a-zäöüß]','',s.lower())
def stable(key): return str(uuid.UUID(bytes=hashlib.sha256(('sciencedojo-lehrbuch-v1:'+key).encode()).digest()[:16],version=4))
def field(key,label=None,multiline=False,options=None,labels=None,multiple=False):
    out={'id':str(key),'label':label or f'Lücke {key}','options':options or [],'evaluation':'review','multiline':multiline}
    if labels:out['optionLabels']=labels
    if multiple:out['multiple']=True
    return out

def color_ratio(word, array):
    H,W,_=array.shape
    a=array[max(0,int(word['y']*H)-2):min(H,int((word['y']+word['h'])*H)+2),max(0,int(word['x']*W)-2):min(W,int((word['x']+word['w'])*W)+2)].astype(int)
    if not a.size:return 0
    ink=a.min(2)<185
    return float(((a.max(2)-a.min(2)>35)&ink).sum()/max(1,ink.sum()))

def green_left(row,array):
    H,W,_=array.shape
    a=array[max(0,int(row['y']*H)-4):min(H,int((row['y']+row['h'])*H)+4),int(.075*W):max(int(.13*W),int(row['x']*W))].astype(int)
    return int(((a[:,:,1]>a[:,:,0]+12)&(a[:,:,1]>a[:,:,2]+8)&(a.min(2)<185)).sum()) if a.size else 0

def headings(rows,array,pdftext):
    out=[]
    source=[]
    for line in pdftext.splitlines():
        for m in re.finditer(r'(?<!\w)([1-9][a-h]?|[a-h]|la|Sa)\s+(.+)',line):
            if m.start()>16 or re.search(r'[A-Za-zÄÖÜäöüß]{3,}',line[:m.start()]) or len(m[2])<16 or re.match(r'\d',m[2]):continue
            if ACTION.search(m[2]) or 'Sie' in m[2]:source.append(({'la':'1a','Sa':'5a'}.get(m[1],m[1]),norm(m[2])[:35]))
    for row in rows:
        if not .082<row['y']<.88 or row['x']>.85 or not row.get('words'):continue
        words=row['words'];candidate=None
        for i,w in enumerate(words[:8]):
            label=clean(w['text']).translate(str.maketrans({'З':'3','з':'3','а':'a','с':'c','е':'e'}))
            label={'la':'1a','lb':'1b','lc':'1c','ld':'1d','Sa':'5a','Ba':'3a','ba':'6a'}.get(label,label)
            if not re.fullmatch(r'[1-9][a-h]?|[a-h]',label) or color_ratio(w,array)<.28:continue
            if re.search(r'[A-Za-zÄÖÜäöüß]{3,}',' '.join(v['text'] for v in words[:i])):continue
            title=clean(' '.join(v['text'] for v in words[i+1:]))
            if len(label)==1 and label.isalpha() and w['x']>.16 and not (.50<w['x']<.55 and ('Sie' in title or ACTION.match(title))):continue
            if w['x']>.28 and not ('Sie' in title or ACTION.match(title)):continue
            candidate=(label,title);break
        if not candidate:continue
        label,title=candidate
        if not title:
            peer=next((r for r in rows if abs(r['y']-row['y'])<.012 and r['x']>row['x']+.012 and len(r['text'])>15 and (ACTION.match(clean(r['text'])) or 'Sie' in r['text'])),None)
            if not peer:continue
            title=clean(peer['text'])
        matching=next((v for v,t in source if t and (t in norm(title)[:len(t)+5] or norm(title).startswith(t)) and len(norm(title))>15),None)
        if matching:label=matching
        out.append({'raw':label,'row':row,'y':row['y'],'instruction':title,'recovered':False})
    for label,target in source:
        candidates=[r for r in rows if .085<r['y']<.887 and r['x']<.85 and target and target in norm(r['text'])[:len(target)+16]]
        for row in candidates:
            if any(abs(h['y']-row['y'])<.012 for h in out) or green_left(row,array)<8:continue
            if re.match(r'^\d{2}\b',clean(row['text'])):continue
            text=clean(row['text']);pos=next((i for i in range(min(18,len(text))) if norm(text[i:]).startswith(target)),0)
            out.append({'raw':label,'row':row,'y':row['y'],'instruction':text[pos:],'recovered':True})
    return sorted(out,key=lambda h:h['y'])

def figures(image,rows,pdf,kind,base,manual):
    array=np.array(image);H,W,_=array.shape;a=array.astype(int)
    sat=a.max(2)-a.min(2);gray=np.array(image.convert('L'));edges=np.array(image.convert('L').filter(ImageFilter.FIND_EDGES))
    mask=((sat>35)&(a.min(2)<190))|((edges>42)&(gray<185))
    mask[:int(.09*H)]=False;mask[int(.88*H):]=False;mask[:,:int(.075*W)]=False;mask[:,int(.90*W):]=False
    for row in rows:
        for w in row.get('words',[]):
            x=max(0,int(w['x']*W)-3);y=max(0,int(w['y']*H)-3)
            mask[y:min(H,int((w['y']+w['h'])*H)+4),x:min(W,int((w['x']+w['w'])*W)+4)]=False
    small=np.array(Image.fromarray((mask*255).astype('uint8')).resize((100,134),Image.Resampling.BOX))>19
    grown=small.copy()
    for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:grown|=np.roll(np.roll(small,dy,0),dx,1)
    seen=set();boxes=[]
    for yy,xx in zip(*np.where(grown)):
        if (yy,xx) in seen:continue
        q=deque([(yy,xx)]);seen.add((yy,xx));pts=[]
        while q:
            y,x=q.popleft();pts.append((y,x))
            for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:
                v=(y+dy,x+dx)
                if 0<=v[0]<134 and 0<=v[1]<100 and grown[v] and v not in seen:seen.add(v);q.append(v)
        ys,xs=zip(*pts);x0,x1=min(xs)/100,(max(xs)+1)/100;y0,y1=min(ys)/134,(max(ys)+1)/134
        area=(x1-x0)*(y1-y0);density=len(pts)/max(1,(max(xs)-min(xs)+1)*(max(ys)-min(ys)+1))
        if area<.008 or x1-x0<.09 or y1-y0<.045 or density<.26 or (area>.48 and kind not in ['intro','front']):continue
        inner=[r for r in rows if x0<r['x']+r['w']/2<x1 and y0<r['y']+r['h']/2<y1]
        if len(inner)>=3 and sum(len(r['text']) for r in inner)>140:continue
        boxes.append([max(.075,x0-.008),max(.09,y0-.008),min(.91,x1+.008),min(.88,y1+.008)])
    if str(pdf) in manual.get('figures',{}):boxes=manual['figures'][str(pdf)]
    # Merge nearby/overlapping fragments of one illustration, but not separate photos.
    merged=[]
    for box in sorted(boxes,key=lambda b:(b[1],b[0])):
        match=next((b for b in merged if min(b[2],box[2])-max(b[0],box[0])>-.006 and min(b[3],box[3])-max(b[1],box[1])>-.006),None)
        if match is not None:match[:]=[min(match[0],box[0]),min(match[1],box[1]),max(match[2],box[2]),max(match[3],box[3])]
        else:merged.append(box)
    result=[]
    for i,(x0,y0,x1,y1) in enumerate(merged,1):
        if y1-y0>.81:continue
        name=f'p{pdf}-f{i}'
        image.crop((int(x0*W),int(y0*H),int(x1*W),int(y1*H))).save(base/'figures/v1'/f'{name}.jpg',quality=88)
        result.append({'box':[x0,y0,x1,y1],'block':{'type':'figure','asset':name,'alt':f'Originalabbildung, Lehrbuch Seite {pdf-1}'}})
    return result

def contained(row,figs):
    x=row['x']+row['w']/2;y=row['y']+row['h']/2
    return len(row['text'])<50 and any(a<x<c and b<y<d for a,b,c,d in (f['box'] for f in figs))

def ordered(rows):
    # Read columns downwards rather than interleaving unrelated half-sentences.
    left=[r for r in rows if r['x']<.50 and r['w']<.43]
    right=[r for r in rows if r['x']>=.50 and r['w']<.43]
    wide=[r for r in rows if r not in left and r not in right]
    if len(left)>=4 and len(right)>=4:
        top=min(r['y'] for r in left+right);bottom=max(r['y'] for r in left+right)
        before=sorted([r for r in wide if r['y']<top],key=lambda r:r['y']);after=sorted([r for r in wide if r['y']>bottom],key=lambda r:r['y'])
        middle=[r for r in wide if top<=r['y']<=bottom]
        remaining=[]
        for r in middle:
            words=r.get('words',[]);a=[w for w in words if w['x']<.50];b=[w for w in words if w['x']>=.50]
            if a and b:
                left.append({**r,'text':' '.join(w['text'] for w in a)});right.append({**r,'text':' '.join(w['text'] for w in b)})
            else:remaining.append(r)
        return before+sorted(left,key=lambda r:r['y'])+sorted(right,key=lambda r:r['y'])+remaining+after
    return sorted(rows,key=lambda r:(round((r['y']+r['h']/2)/.008),r['x']))

def prose(rows):
    lines=[]
    for r in ordered(rows):
        t=clean(r['text'])
        if r['x']<.14 and re.match(r'^(?:5|10|15|20|25|30|35|40|45|50|55|60)\s+[A-Za-zÄÖÜäöü]',t):t=re.sub(r'^\d+\s+','',t)
        lines.append(t)
    text='\n'.join(lines)
    text=re.sub(r'([a-zäöüß])[-­]\n([a-zäöüß])',r'\1\2',text)
    return text

def make_exercise(id,instruction,rows,figs,book,pdf):
    content=[];fields={};instruction=clean(instruction)
    composing=bool(WRITING.search(instruction));fill=bool(FILL.search(instruction));choice=bool(re.search(r'kreuzen|wählen.*aus|richtig.*falsch',instruction,re.I))
    first_item=min((r['y'] for r in rows if ITEM.match(clean(r['text']))),default=None)
    if first_item is not None and any(re.match(r'^[\[□☐(]?[a-f][\]) .:]?\s+',clean(r['text'])) for r in rows):
        lines=prose([r for r in rows if r['y']<first_item-.003]).splitlines()+[clean(r['text']) for r in sorted((r for r in rows if r['y']>=first_item-.003),key=lambda r:(r['y'],r['x']))]
    else:lines=[clean(r['text']) for r in ordered(rows)]
    text='\n'.join(lines)
    # Source-numbered multiple-choice groups: option text remains source-backed.
    groups=[];current=None;option=None
    for line in lines:
        m=ITEM.match(line)
        if m and int(m[1])<=30:
            current={'number':m[1],'prompt':m[2],'options':{},'unlabelled':[]};groups.append(current);option=None;continue
        letter=re.match(r'^[\[□☐(]?([a-f])[\]) .:]?\s+(.+)',line)
        if current and letter:
            option=letter[1]
            if option=='b' and not current['options'] and current['unlabelled']:
                current['options']['a']=' '.join(current['unlabelled']);current['unlabelled']=[]
            current['options'][option]=letter[2]
        elif current and option and len(line)>2:current['options'][option]+=' '+line
        elif current and len(line)>2:current['unlabelled'].append(line)
    matches={}
    for line in lines:
        m=re.match(r'^_*\s*([A-Ha-h])[.)]?\s+(.+)',line)
        if m:matches[m[1].upper()]=m[2]
    matching=bool(len(matches)>=2 and len(groups)>=2 and re.search(r'ordnen|verbinden|passt',instruction,re.I))
    mcq=groups and sum(len(g['options'])>=2 for g in groups)>=max(1,len(groups)*.6)
    if matching:
        rows_out=[]
        for g in groups:
            key='item-'+g['number'];prompt=g['prompt']
            fields[key]=field(key,g['number']+'. '+prompt,options=list(matches),labels=matches)
            rows_out.append([g['number']+'. '+prompt,'{{'+key+'}}'])
        content.append({'type':'table','headers':['Aufgabe','Deine Zuordnung'],'rows':rows_out})
    elif mcq:
        first=next((i for i,t in enumerate(lines) if ITEM.match(t)),0)
        if first:content.append({'type':'reading','text':'\n'.join(lines[:first])})
        for g in groups:
            if g['unlabelled']:g['prompt']+=' '+' '.join(g['unlabelled'])
            if len(g['options'])>=2:
                fields['item-'+g['number']]=field('item-'+g['number'],g['number']+'. '+g['prompt'],options=list(g['options']),labels=g['options'])
            else:fields['item-'+g['number']]=field('item-'+g['number'],g['number']+'. '+g['prompt'],True)
    else:
        gap=0
        def numbered(m):
            key=m[1];fields.setdefault(key,field(key));return '{{'+key+'}}'
        if fill:
            text=re.sub(r'_*(?:\s*)\((\d{1,2})\)(?:\s*)_*',numbered,text)
            def underscores(m):
                nonlocal gap
                gap+=1;key=f'gap-{gap}';fields[key]=field(key);return ' {{'+key+'}} '
            text=re.sub(r'_{1,}',underscores,text)
        output=[]
        for i,line in enumerate(text.splitlines()):
            m=ITEM.match(line)
            bullet=re.match(r'^[•●]\s+(.+\?)$',line)
            if not composing and m and int(m[1])<=30 and '{{' not in line:
                key='item-'+m[1];fields.setdefault(key,field(key,m[1]+'. '+m[2],not fill));line+=' {{'+key+'}}'
            elif not composing and bullet and not choice:
                key='question-'+str(i+1);fields[key]=field(key,bullet[1],True);line+=' {{'+key+'}}'
            output.append(line)
        if output:content.append({'type':'reading' if len(text)>700 else 'text','text':'\n'.join(output)})
        # A response is attached to the actual source task, never to an arbitrary page.
        if not fields:
            count=re.search(r'\b(zwei|drei|vier|fünf|sechs)\s+(Fotoideen|Gründe|Beispiele|Fragen|Vorschläge|Sätze|Argumente|Stichwörter)\b',instruction,re.I)
            if count and not composing:
                size={'zwei':2,'drei':3,'vier':4,'fünf':5,'sechs':6}[count[1].lower()]
                fields={str(i):field(str(i),f'{i}. {count[2]}',True) for i in range(1,size+1)}
            else:fields['response']=field('response','Dein Text' if composing else 'Deine Antwort / Gesprächsnotizen',True)
    for fig in figs:content.insert(0,fig['block'])
    notes=''
    if MEDIA.search(instruction):notes='Die zugehörige Audio-/Videoaufnahme wurde nicht mitgeliefert. Du kannst hier Notizen oder einen Entwurf speichern; diese Medienaufgabe ist ohne die Aufnahme nicht vollständig bearbeitbar.'
    return {'id':id,'instruction':instruction,'mode':'match' if matching else 'choice' if mcq else 'writing' if composing else 'fill','wordBank':list(matches) if matching else [],'wordBankLabels':{key:key+' · '+value for key,value in matches.items()} if matching else {},'fields':list(fields.values()),'checklist':[],'solutionPage':0,'notes':notes,'content':content,'markers':[]}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--pdf',required=True,type=Path);parser.add_argument('--base',type=Path,default=ROOT/'private-materials/aspekte-neu-b2-lehrbuch/derived');args=parser.parse_args();base=args.base
    (base/'native/v1').mkdir(parents=True,exist_ok=True);(base/'figures/v1').mkdir(parents=True,exist_ok=True)
    manual=json.loads((base/'native-authoring-overrides.json').read_text()) if (base/'native-authoring-overrides.json').exists() else {}
    pdf=PdfReader(args.pdf);report={'pages':0,'exercises':0,'fields':0,'figures':0,'inline':0,'pagesWithoutTasks':[],'headings':{},'recovered':[]};parent=0;previous=None;lastSection='Lehrbuch';all_ids=set();manifest=[]
    for index in range(1,203):
        book=index-1;relative=(book-8)%16;chapter=(book-8)//16 if 8<=book<=167 else -1
        if relative==0 and chapter>=0:parent=0;previous=None;lastSection=TITLES[chapter]
        kind='front' if book<8 else 'reference' if book>=168 or relative==13 else 'intro' if relative==0 else 'exercises'
        raw=json.load(open(base/'pages'/f'page-{index:03}.words.json'));image=Image.open(base/'pages'/f'page-{index:03}.jpg').convert('RGB');array=np.array(image)
        rows=[r for r in raw if .085<r['y']<.887 and .075<r['x']<.89 and r['confidence']>=.30 and not re.fullmatch(r'(?:[→•~]?\s*(?:Ü|U|AB)\s*[\w+–-]*|Modul\s*\d+|[G©®])',clean(r['text'])) and not re.fullmatch(r'\d{1,2}\.\d+(?:[-–]\d+)?',clean(r['text']))]
        hs=headings(raw,array,pdf.pages[index-1].extract_text()) if kind=='exercises' else []
        if str(index) in manual.get('headings',{}):
            hs=[]
            for h in manual['headings'][str(index)]:
                row=min(rows,key=lambda r:abs(r['y']-h['y']));hs.append({**h,'raw':h['id'],'row':row,'instruction':h.get('instruction',clean(row['text'])),'recovered':True})
        for h in manual.get('extraHeadings',{}).get(str(index),[]):
            hs=[v for v in hs if abs(v['y']-h['y'])>.012]
            row=min(rows,key=lambda r:abs(r['y']-h['y']));hs.append({**h,'raw':h['id'],'row':row,'instruction':h.get('instruction',clean(row['text'])),'recovered':True})
        hs.sort(key=lambda h:h['y'])
        fs=figures(image,raw,index,kind,base,manual);visible=[r for r in rows if not contained(r,fs)]
        page={'nativeVersion':1,'pdfPage':index,'bookPage':book,'kind':kind,'section':TITLES[chapter] if kind=='intro' else next((clean(r['text']) for r in raw if r['y']<.08 and r['x']<.60 and len(r['text'])>4), lastSection if book<168 else 'Anhang'),'content':[],'exercises':[],'entryIds':{},'exerciseNotes':{},'notices':[]}
        boundaries=[];parents={0:parent,1:parent}
        for i,h in enumerate(hs):
            side=1 if h['row']['x']>.45 else 0;parent=parents[side]
            token=h['raw'];m=re.match(r'^(\d+)([a-h]?)$',token)
            if m:parent=int(m[1]);id=token
            else:id=str(parent or 1)+token
            parents[side]=parent
            title=h['instruction'];header=[h['row']]
            # Join wrapped instructions while leaving their readings/examples intact.
            for candidate in sorted(rows,key=lambda r:r['y']):
                last=header[-1]
                if candidate['y']<=last['y']+.003 or candidate['y']>h['y']+.075 or not (h['row']['x']-.025<candidate['x']<max(.25,h['row']['x']+.12)):continue
                if re.search(r'[.!?:]$',title) or candidate['y']-(last['y']+last['h'])>.022:break
                if i+1<len(hs) and candidate['y']>=hs[i+1]['y']-.003:break
                if candidate is h['row']:continue
                title+=' '+clean(candidate['text']);header.append(candidate)
            h.update(id=id,instruction=title,headers=header)
            if h.get('recovered'):report['recovered'].append(f'{book}:{id}')
            is_section=bool(re.fullmatch(r'\d+',token) and not ACTION.search(title) and i+1<len(hs) and hs[i+1]['raw']=='a' and hs[i+1]['y']-h['y']<.12)
            if title and not is_section:boundaries.append(h)
        lastSection=page['section']
        report['headings'][str(book)]=[h['id'] for h in boundaries]
        if boundaries:
            prefix=[r for r in visible if r['y']<boundaries[0]['y']-.004]
            prefix_figs=[f for f in fs if f['box'][1]<boundaries[0]['y']-.02]
            has_response=any(ITEM.match(clean(r['text'])) for r in prefix)
            if has_response and previous:
                e=make_exercise(previous['id'],previous['instruction']+' (Fortsetzung)',prefix,prefix_figs,book,index);page['exercises'].append(e)
            else:
                if prefix:page['content'].append({'type':'reading','text':prose(prefix)})
                page['content'] += [f['block'] for f in prefix_figs]
            for i,h in enumerate(boundaries):
                parallel=any(v['row']['x']>.45 for v in boundaries)
                side=1 if h['row']['x']>.45 else 0
                peers=[v for v in boundaries[i+1:] if not parallel or (v['row']['x']>.45)==bool(side)]
                stop=peers[0]['y'] if peers else .887
                taskrows=[r for r in visible if h['y']-.002<=r['y']<stop-.003 and (not parallel or (r['x']>.45)==bool(side)) and not any(r in v.get('headers',[]) for v in hs)]
                taskfigs=[f for f in fs if h['y']-.02<=f['box'][1]<stop-.02 and (not parallel or (f['box'][0]>.45)==bool(side))]
                e=make_exercise(h['id'],h['instruction'],taskrows,taskfigs,book,index)
                page['exercises'].append(e);previous={'id':h['id'],'instruction':h['instruction']}
        else:
            if visible:page['content'].append({'type':'reading','text':prose(visible)})
            page['content'] += [f['block'] for f in fs]
            # Unnumbered portrait assignments are source tasks, not invented quizzes.
            if kind=='exercises' and relative==12:
                candidates=[r for r in visible if r['y']>.65 and re.match(r'^(?:Sammeln|Stellen|Recherchieren|Schreiben)',clean(r['text']))]
                if candidates:
                    top=min(r['y'] for r in candidates);instr=' '.join(clean(r['text']) for r in sorted(visible,key=lambda r:r['y']) if top<=r['y']<top+.08)
                    page['content']=[b for b in page['content'] if b['type']=='figure']+[{'type':'reading','text':prose([r for r in visible if r['y']<top])}]
                    page['exercises'].append(make_exercise('portrait',instr,[],[],book,index))
        override=manual.get('pages',{}).get(str(index),{})
        if 'exercises' in override:page['exercises']=override['exercises']
        if 'content' in override:page['content']=override['content']
        page['section']=override.get('section',page['section'])
        order=manual.get('exerciseOrder',{}).get(str(index),[])
        if order:page['exercises'].sort(key=lambda e:order.index(e['id']) if e['id'] in order else len(order))
        seen=set()
        for e in page['exercises']:
            patch=manual.get('exercises',{}).get(f'{index}:{e["id"]}',{})
            e.update(patch)
            if e['id'] in seen:e['id']+='-continuation'
            seen.add(e['id']);e['wordBank']=list(dict.fromkeys(e.get('wordBank',[])))
            for f in e['fields']:
                key=f'{book}:{e["id"]}:{f["id"]}';value=stable('answer:'+key)
                assert value not in all_ids,key;all_ids.add(value);page['entryIds'][key]=value
            page['exerciseNotes'][e['id']]={role:stable(f'{role}:{book}:{e["id"]}') for role in ['question','reflection','review']}
            for b in e.get('content',[]):
                tokens=re.findall(r'\{\{([^}#]+)(?:#\d+)?\}\}',b.get('text','')+' '.join(' '.join(row) for row in b.get('rows',[])))
                assert all(any(f['id']==t for f in e['fields']) for t in tokens),(book,e['id'],tokens)
                report['inline']+=len(tokens)
            report['exercises']+=1;report['fields']+=len(e['fields'])
        if not page['exercises']:report['pagesWithoutTasks'].append(book)
        report['pages']+=1;report['figures']+=len(fs)
        (base/'native/v1'/f'{index:03}.json').write_text(json.dumps(page,ensure_ascii=False,indent=2))
        manifest.append({'pdfPage':index,'bookPage':book,'kind':kind,'exercises':len(page['exercises']),'fields':sum(len(e['fields']) for e in page['exercises'])})
    (base/'native/v1/manifest.json').write_text(json.dumps({'version':1,'title':'Aspekte neu B2 · Lehrbuch','pages':manifest,'exercises':report['exercises'],'fields':report['fields']},ensure_ascii=False,indent=2))
    (base/'native-authoring-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k not in ['headings','recovered']},ensure_ascii=False))
if __name__=='__main__':main()
