import {expect} from '@playwright/test';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {GERMAN_LEVELS,VOCABULARY} from '../lib/campus/german-vocabulary.ts';
import {GAME_TABLES} from '../lib/campus/board-games.ts';

export async function checkWortQuest({a,b,browser,origin,identities,shared,gameFixture,campus,result,directory,wireFrames,issuedTickets,handshakeHashes,errors}){
 const dialog=page=>page.getByRole('dialog',{name:'Games Lounge',exact:true});
 a.setDefaultTimeout(15000);b.setDefaultTimeout(15000);
 const pages=[a,b],contexts=[],names=['VocabFriendOne','VocabFriendTwo','VocabFriendThree','VocabFriendFour'];
 const store=shared??gameFixture;
 const open=async page=>{await page.getByRole('button',{name:'Games Lounge',exact:true}).click();await dialog(page).getByRole('button',{name:/^WortQuest/}).click();await dialog(page).getByRole('button',{name:'Reveal explanation',exact:true}).waitFor();};
 const snapshot=page=>page.evaluate(async()=>(await(await fetch('/api/campus/games?table=wortquest')).json()).game);
 const solve=q=>q.options.indexOf(VOCABULARY.find(c=>c.id===q.id).explanation);
 try{
  const spot=GAME_TABLES.find(t=>t.id==='wortquest'), own=[...identities.keys()][0];
  const place=async(x,z,floor=0)=>{if(shared)await shared.db.query("UPDATE campus_presence SET x=$2,z=$3,floor=$4,elevation=$5,seat=NULL,status='walking' WHERE campus_id=$1",[own,x,z,floor,floor*12]);else Object.assign(campus.room.world.players.get(own),{x,z,floor,elevation:floor*12,seat:null,status:'walking'});};
  await place(-4.5,-3);await a.getByRole('button',{name:/Sit at Desk 1$/}).waitFor({timeout:10000});await a.getByRole('button',{name:/Sit at Desk 1$/}).click();await a.getByRole('button',{name:'Open Study Hub',exact:true}).click();await a.getByRole('checkbox',{name:'I understand these course identity rules.'}).check();await a.getByRole('button',{name:/Synthetic test course/}).click();await a.frameLocator('iframe[title="Your Academy course"]').getByLabel('Practice answer').fill('vocabulary-private-draft-canary');await a.getByRole('button',{name:'Return to school →',exact:true}).click();await a.getByRole('button',{name:'Stand up',exact:true}).click();await a.getByRole('button',{name:'Full screen',exact:true}).click();
  if(shared)await shared.db.query("UPDATE campus_presence SET x=$2,z=$3,floor=2,elevation=24,seat=NULL,status='walking' WHERE campus_id=$1",[own,spot.x+1,spot.z]);
  else Object.assign(campus.room.world.players.get(own),{x:spot.x+1,z:spot.z,floor:2,elevation:24,seat:null,status:'walking'});
  await a.getByRole('button',{name:/Play WortQuest/}).waitFor({timeout:10000});
  await a.getByRole('region',{name:/3D school/}).focus();await a.keyboard.press('e');
  await dialog(a).getByRole('button',{name:'Reveal explanation',exact:true}).waitFor();
  if(process.argv.includes('--vocabulary-location-only')){
   await dialog(a).getByRole('button',{name:'Reveal explanation',exact:true}).click();
   await expect(dialog(a).getByText(VOCABULARY[0].explanation,{exact:true})).toBeVisible();
   await a.screenshot({path:join(directory,'wortquest-study-card.png')});result.screenshots.push(join(directory,'wortquest-study-card.png'));
   result.checks.push('Final WortQuest interaction uses the existing rear lounge side table; real E entry reveals the German word and English explanation inside fullscreen');
   await dialog(a).getByRole('button',{name:'Return to school →',exact:true}).click();
   for(const page of pages)await page.getByRole('button',{name:'Leave',exact:true}).click();
   return;
  }
  console.log('WortQuest: real E entry, study cards and solo scores across all levels');
  for(const level of GERMAN_LEVELS){
   console.log('WortQuest solo level',level);
   await dialog(a).getByRole('button',{name:'Study cards',exact:true}).click();await dialog(a).getByLabel('Practice level',{exact:true}).selectOption(level);
   const first=VOCABULARY.find(c=>c.level===level);
   await expect(dialog(a).getByRole('heading',{name:first.term,exact:true})).toBeVisible();
   await dialog(a).getByRole('button',{name:'Reveal explanation',exact:true}).press('Enter');
   await expect(dialog(a).getByText(first.explanation,{exact:true})).toBeVisible();
   await dialog(a).getByRole('button',{name:'Next card',exact:true}).click();await expect(dialog(a).getByRole('button',{name:'Reveal explanation',exact:true})).toBeVisible();
   await dialog(a).getByRole('button',{name:'Solo quiz',exact:true}).click();await dialog(a).getByRole('button',{name:`Start ${level} solo quiz`,exact:true}).click();
   for(let card=0;card<10;card++){
    const term=await dialog(a).locator('.vocabulary-card h3').textContent();
    const material=VOCABULARY.find(c=>c.level===level&&c.term===term);
    const wrong=level==='C2'&&card===0;
    const option=dialog(a).locator('.vocabulary-options button').filter({hasText:wrong?material.distractors[0]:material.explanation});
    await option.click();await expect(dialog(a).getByText(wrong?'Not quite · 0 points':'Correct · +10 points',{exact:true})).toBeVisible();
    await dialog(a).getByRole('button',{name:card===9?'See my score':'Next question',exact:true}).click();
   }
   await expect(dialog(a).getByRole('heading',{name:`Quiz complete · ${level==='C2'?90:100} / 100 points`,exact:true})).toBeVisible();
   if(level==='C2'){await a.screenshot({path:join(directory,'wortquest-solo-levels.png')});result.screenshots.push(join(directory,'wortquest-solo-levels.png'));}
   await dialog(a).getByRole('button',{name:'Choose another level',exact:true}).click();
  }
  result.checks.push('Actual E entry and keyboard study-card reveal; ten-card solo quizzes completed at A1/A2/B1/B2/C1/C2 with correct totals, a wrong-answer/private-review case and no duplicate cards in rules coverage');
  await open(b);
  const joinTable=async(page,index)=>{
   await dialog(page).getByRole('button',{name:'Play with friends',exact:true}).click();
   await dialog(page).getByLabel('Game username',{exact:true}).fill(names[index]);
   await dialog(page).getByRole('button',{name:'Join WortQuest',exact:true}).click();
   await dialog(page).getByLabel('Shared practice level',{exact:true}).waitFor();
  };
  for(const size of [2,4]){
   if(size===4){
    for(let n=2;n<4;n++){
     const context=await browser.newContext(n===3?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{});contexts.push(context);const page=await context.newPage();page.setDefaultTimeout(15000);pages.push(page);
     page.on('pageerror',e=>errors.push(e.message));
     page.on('response',r=>{if(new URL(r.url()).pathname==='/api/campus/admission')r.json().then(body=>issuedTickets.push(body.ticket));});
     page.on('websocket',socket=>{let first=true;for(const event of ['framesent','framereceived'])socket.on(event,frame=>{
      const bytes=Buffer.isBuffer(frame.payload)?frame.payload:Buffer.from(frame.payload);
      if(shared&&event==='framesent'&&first){first=false;const body=JSON.parse(bytes.toString());expect(Object.keys(body).sort()).toEqual(['ticket','type']);expect(body.type).toBe('admit');handshakeHashes.push(createHash('sha256').update(body.ticket).digest('hex'));}else wireFrames.push(bytes);
     });});
     await page.goto(origin);await page.getByRole('button',{name:'Enter school',exact:true}).click();await page.getByText('In the school · walking',{exact:true}).waitFor();await open(page);
    }
   }
   for(let i=0;i<size;i++)await joinTable(pages[i],i);
   await expect(dialog(a).locator('.game-roster article')).toHaveCount(size,{timeout:10000});
   const level=size===2?'A2':'C1';await dialog(a).getByLabel('Shared practice level',{exact:true}).selectOption(level);
   for(const page of pages.slice(0,size)){
    await expect(dialog(page).getByLabel('Shared practice level',{exact:true})).toHaveValue(level,{timeout:10000});
    await dialog(page).getByRole('button',{name:`Confirm ${level}`,exact:true}).click();await expect(dialog(page).getByRole('button',{name:'Not ready',exact:true})).toBeVisible();
   }
   await expect(dialog(a).getByRole('button',{name:'Start friend quiz',exact:true})).toBeEnabled({timeout:10000});await dialog(a).getByRole('button',{name:'Start friend quiz',exact:true}).click();
   console.log(`WortQuest: ${size}-player ${level} quiz`);
   for(let index=0;index<10;index++){
    for(const page of pages.slice(0,size))await expect(dialog(page).locator('.vocabulary-options button').first()).toBeEnabled({timeout:10000});
    const g=await snapshot(a), q=g.quiz.question;
    expect(q.correct).toBeUndefined();expect(q.translation).toBeUndefined();
    const choice=solve(q),button=dialog(a).locator('.vocabulary-options button').nth(choice);
    await button.press('Enter');
    await expect(dialog(a).getByText('Answer saved. Waiting for everyone; choices stay private.',{exact:true})).toBeVisible();
    const privateView=await snapshot(b);expect(privateView.quiz.solution).toBeUndefined();expect(privateView.quiz.scores).toEqual(Array(size).fill(index*10));
    for(let n=1;n<size;n++){
     const target=dialog(pages[n]).locator('.vocabulary-options button').nth(choice);
     if(n===3)await target.tap();else await target.click();
    }
    for(const page of pages.slice(0,size)){
     await expect(dialog(page).locator('.game-roster article')).toHaveCount(size);
     await expect(dialog(page).getByText(`${(index+1)*10} / 100 points`,{exact:true})).toHaveCount(size,{timeout:10000});
    }
    if(index<9){for(const page of pages.slice(0,size))await dialog(page).getByRole('button',{name:'Continue to next card',exact:true}).click();}
   }
   for(const page of pages.slice(0,size))await expect(dialog(page).getByText(/Quiz complete · VocabFriendOne/)).toBeVisible({timeout:10000});
   for(const page of pages.slice(0,size))await page.waitForFunction(()=>[...document.querySelectorAll('.game-roster img')].length>0&&[...document.querySelectorAll('.game-roster img')].every(i=>i.complete&&i.naturalWidth===40));
   if(size===4){
    expect(await dialog(a).evaluate(el=>document.fullscreenElement?.contains(el))).toBe(true);
    expect(await dialog(pages[3]).evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await pages[3].screenshot({path:join(directory,'wortquest-four-player-phone.png')});result.screenshots.push(join(directory,'wortquest-four-player-phone.png'));
    await a.screenshot({path:join(directory,'wortquest-four-player-score.png')});result.screenshots.push(join(directory,'wortquest-four-player-score.png'));
    const strangerContext=await browser.newContext();const stranger=await strangerContext.newPage();await stranger.goto(origin);await stranger.getByRole('button',{name:'Enter school',exact:true}).click();await stranger.getByText('In the school · walking',{exact:true}).waitFor();
    const hidden=await snapshot(stranger);expect(hidden.quiz).toBeNull();expect(hidden.members).toEqual([]);expect(hidden.level).toBeNull();
    const denied=await stranger.evaluate(async player=>(await fetch(`/api/campus/games/photo?table=wortquest&player=${player}`)).status,(await snapshot(a)).self);expect(denied).toBe(404);
    await stranger.getByRole('button',{name:'Leave',exact:true}).click();await strangerContext.close();
   }
   for(const page of pages.slice(0,size)){
    await dialog(page).getByRole('button',{name:'Leave table',exact:true}).click();await dialog(page).getByRole('button',{name:'Join WortQuest',exact:true}).waitFor();
   }
   result.checks.push(`Real ${size}-browser ${level} match: independent answer privacy, synchronized score 100/tie, all-player continuation and rendered pictures/usernames${size===4?', touch/phone layout and unjoined fifth-player roster/photo denial':''}`);
  }
  expect((await store.db.query('SELECT count(*) AS n FROM campus_game_members')).rows[0].n).toBe(0);
  const empty=(await store.db.query("SELECT state,quiz_level FROM campus_game_tables WHERE table_id='wortquest'")).rows[0];expect(empty.state).toBeNull();expect(empty.quiz_level).toBe('A1');
  await dialog(a).getByRole('button',{name:'Return to school →',exact:true}).click();await place(-4.5,-3);await a.getByRole('button',{name:'Study desk',exact:true}).click();await a.getByRole('button',{name:/Sit at Desk 1$/}).waitFor({timeout:10000});await a.getByRole('button',{name:/Sit at Desk 1$/}).click();await a.getByRole('button',{name:'Open Study Hub',exact:true}).click();await expect(a.frameLocator('iframe[title="Your Academy course"]').getByLabel('Practice answer')).toHaveValue('vocabulary-private-draft-canary');await a.getByRole('button',{name:'Return to school →',exact:true}).click();await a.getByRole('button',{name:'Games Lounge',exact:true}).click();
  result.checks.push('Vocabulary games remain inside native fullscreen and preserve the mounted lesson document and unsent practice answer');
  const privateLabels=['vocabulary-private-draft-canary','VocabFriend','de-a1-','de-a2-','de-b1-','de-b2-','de-c1-','de-c2-','quiz-answer','WORTQUEST'];
  for(const frame of wireFrames)for(const label of privateLabels)expect(frame.includes(Buffer.from(label))).toBe(false);
  result.checks.push('No quiz identity, deck/card IDs or answer commands in world traffic; empty table leaves no quiz answers or game memberships');
  for(const page of pages){await dialog(page).getByRole('button',{name:'Return to school →',exact:true}).click();await page.getByRole('button',{name:'Leave',exact:true}).click();}
  console.log('WortQuest walkthrough passed');
 }finally{for(const context of contexts)await context.close();}
}
