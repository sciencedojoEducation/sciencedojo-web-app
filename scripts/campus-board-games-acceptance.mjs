import {expect} from "@playwright/test";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {GAME_TABLES} from "../lib/campus/board-games.ts";

export async function checkBoardGames({a,b,browser,origin,identities,shared,gameFixture,campus,result,directory,wireFrames,issuedTickets,handshakeHashes,errors}){
  console.log('Games walkthrough: two connected campus browsers');
  const pages=[a,b],contexts=[], names=['FriendOne','FriendTwo','FriendThree','FriendFour'];
  const store=shared??gameFixture;
  const identityList=()=>[...identities.keys()];
  const pose=async(index,x,z,floor=2)=>{
    const own=identityList()[index];
    if(shared)await shared.db.query('UPDATE campus_presence SET x=$2,z=$3,floor=$4,elevation=$5,seat=NULL,status=\'walking\' WHERE campus_id=$1',[own,x,z,floor,floor*12]);
    else Object.assign(campus.room.world.players.get(own),{x,z,floor,elevation:floor*12,seat:null,status:'walking'});
  };
  const dialog=page=>page.getByRole('dialog',{name:'Games Lounge',exact:true});
  const open=async(page,table='four')=>{
    await page.getByRole('button',{name:'Games Lounge',exact:true}).click();
    await dialog(page).waitFor();
    if(table==='boxes')await dialog(page).getByRole('button',{name:/Dots & Boxes/}).click();
    await page.waitForFunction(()=>!!document.querySelector('dialog.campus-games[open] .game-join,dialog.campus-games[open] .game-roster'));
  };
  const joinGame=async(page,index,table='four')=>{
    await dialog(page).getByLabel('Game username',{exact:true}).fill(names[index]);
    await dialog(page).getByRole('button',{name:table==='four'?'Join Four in a Row':'Join Dots & Boxes',exact:true}).click();
    await dialog(page).getByRole('button',{name:'Ready to play',exact:true}).waitFor();
  };
  const readyStart=async(active)=>{
    for(const page of active){await dialog(page).getByRole('button',{name:/^(Ready to play|Ready for rematch)$/}).click();await dialog(page).getByRole('button',{name:'Not ready',exact:true}).waitFor();}
    const start=dialog(active[0]).getByRole('button',{name:/^Start (game|rematch)$/});
    await expect(start).toBeEnabled({timeout:10000});await start.click();
    for(const page of active)await expect(dialog(page).getByRole('status')).toContainText("FriendOne's turn",{timeout:10000});
  };
  // E activation uses the existing authoritative world, never a production teleport.
  await pose(0,GAME_TABLES[0].x+1,GAME_TABLES[0].z);
  const interaction=a.getByRole('button',{name:/Play Four in a Row/});
  await interaction.waitFor({timeout:10000});
  const stage=a.getByRole('region',{name:/3D school/});await stage.focus();await a.keyboard.press('e');
  await dialog(a).waitFor();
  console.log('Games walkthrough: E opened the table');
  await joinGame(a,0);await open(b);await joinGame(b,1);
  await expect(dialog(a).locator('.game-roster strong')).toHaveCount(2);
  for(const page of pages)await page.waitForFunction(()=>[...document.querySelectorAll('.game-roster img')].length===2&&[...document.querySelectorAll('.game-roster img')].every(i=>i.complete&&i.naturalWidth===40));
  const own=await a.evaluate(async()=> (await(await fetch('/api/campus/games?table=four')).json()).game.self);
  const outsider=await browser.newContext();contexts.push(outsider);const spectator=await outsider.newPage();
  await spectator.goto(origin);await spectator.getByRole('button',{name:'Enter school',exact:true}).click();await spectator.getByText('In the school · walking',{exact:true}).waitFor();
  const outsiderPrivacy=await spectator.evaluate(async player=>{
    const game=await(await fetch('/api/campus/games?table=four')).json();
    const photo=await fetch(`/api/campus/games/photo?table=four&player=${player}`);
    return {members:game.game.members,state:game.game.state,photo:photo.status};
  },own);
  expect(outsiderPrivacy).toEqual({members:[],state:null,photo:404});
  await spectator.getByRole('button',{name:'Leave',exact:true}).click();await outsider.close();contexts.pop();
  // Typing game usernames/using arrows must not move a player.
  const before=shared?(await shared.db.query('SELECT x,z FROM campus_presence WHERE campus_id=$1',[identityList()[0]])).rows[0]:campus.room.world.players.get(identityList()[0]);
  const frozen={x:before.x,z:before.z};await dialog(a).getByRole('button',{name:'Ready to play',exact:true}).focus();await a.keyboard.press('w');await a.keyboard.press('ArrowLeft');
  console.log('Games walkthrough: joined profiles, private roster and keyboard isolation');
  await readyStart(pages);
  const after=shared?(await shared.db.query('SELECT x,z FROM campus_presence WHERE campus_id=$1',[identityList()[0]])).rows[0]:campus.room.world.players.get(identityList()[0]);expect({x:after.x,z:after.z}).toEqual(frozen);
  for(const [index,col] of [[0,1],[1,2],[0,1],[1,2],[0,1],[1,2],[0,1]]){
    const page=pages[index],drop=dialog(page).getByRole('button',{name:`Drop in column ${col}`,exact:true});
    await expect(drop).toBeEnabled({timeout:10000});if(index===0&&col===1&&await dialog(page).locator('.game-four-cells span').filter({hasText:'A'}).count()===0)await drop.press('Enter');else await drop.click();
    if(index===0&&col===1&&await dialog(page).getByRole('status').textContent()==='FriendOne wins!')break;
    await expect(dialog(page).locator('.game-four-cells span').filter({hasText:index===0?'A':'B'})).not.toHaveCount(0);
  }
  for(const page of pages)await expect(dialog(page).getByRole('status')).toHaveText('FriendOne wins!',{timeout:10000});
  await a.screenshot({path:join(directory,'board-four-two-player-win.png')});result.screenshots.push(join(directory,'board-four-two-player-win.png'));
  await readyStart(pages);await expect(dialog(a).locator('.game-four-cells span').filter({hasText:/[AB]/})).toHaveCount(0);
  for(const page of pages){await dialog(page).getByRole('button',{name:'Leave table',exact:true}).click();await dialog(page).getByLabel('Game username',{exact:true}).waitFor();await dialog(page).getByRole('button',{name:'Return to school →',exact:true}).click();}
  result.checks.push('Real E table entry, two-browser Four in a Row win/unanimous rematch, rendered profile photos/usernames, isolated keyboard input, and unjoined-browser roster/photo denial');
  console.log('Games walkthrough: two-player win and rematch complete');
  // Open retained coursework before switching to the lounge.
  await pose(0,-4.5,-3,0);await a.getByRole('button',{name:/Sit at Desk 1$/}).waitFor({timeout:10000});
  await a.getByRole('button',{name:/Sit at Desk 1$/}).click();await a.getByRole('button',{name:'Open Study Hub',exact:true}).click();
  await a.getByRole('checkbox',{name:'I understand these course identity rules.'}).check();await a.getByRole('button',{name:/Synthetic test course/}).click();
  await a.frameLocator('iframe[title="Your Academy course"]').getByLabel('Practice answer').fill('board-games-retained-course-canary');
  await a.getByRole('button',{name:'Return to school →',exact:true}).click();
  await a.getByRole('button',{name:'Full screen',exact:true}).click();
  await open(a,'boxes');await joinGame(a,0,'boxes');await open(b,'boxes');await joinGame(b,1,'boxes');
  for(let index=2;index<4;index++){
    const context=await browser.newContext(index===3?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});contexts.push(context);
    const page=await context.newPage();pages.push(page);
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',response=>{if(new URL(response.url()).pathname==='/api/campus/admission')response.json().then(body=>issuedTickets.push(body.ticket));});
    page.on('websocket',socket=>{
      let first=true;
      for(const event of ['framesent','framereceived'])socket.on(event,frame=>{
        const bytes=Buffer.isBuffer(frame.payload)?frame.payload:Buffer.from(frame.payload);
        if(shared&&event==='framesent'&&first){first=false;const body=JSON.parse(bytes.toString());expect(Object.keys(body).sort()).toEqual(['ticket','type']);expect(body.type).toBe('admit');handshakeHashes.push(createHash('sha256').update(body.ticket).digest('hex'));}
        else wireFrames.push(bytes);
      });
    });
    await page.goto(origin);await page.getByRole('button',{name:'Enter school',exact:true}).click();await page.getByText('In the school · walking',{exact:true}).waitFor();await open(page,'boxes');await joinGame(page,index,'boxes');
  }
  for(const page of pages)await expect(dialog(page).locator('.game-roster article')).toHaveCount(4,{timeout:10000});
  await pages[3].setViewportSize({width:390,height:844});
  expect(await dialog(pages[3]).evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await readyStart(pages);
  console.log('Games walkthrough: four-player Dots & Boxes started');
  for(let edge=0;edge<40;edge++){
    const game=await a.evaluate(async()=> (await(await fetch('/api/campus/games?table=boxes')).json()).game);
    const index=game.state.turn,page=pages[index];
    const button=dialog(page).getByRole('button',{name:new RegExp(`^(Horizontal|Vertical) edge ${edge+1}(,|$)`)});
    await expect(button).toBeEnabled({timeout:10000});if(index===3)await button.tap();else await button.click();
    await expect(button).toBeDisabled({timeout:10000});
    // Wait for authoritative confirmation, not merely the local busy state.
    await expect.poll(async()=>a.evaluate(async e=>(await(await fetch('/api/campus/games?table=boxes')).json()).game.state.board[e],edge),{timeout:10000}).toBeGreaterThanOrEqual(0);
  }
  for(const page of pages)await expect(dialog(page).getByRole('status')).toContainText(/wins|tie/,{timeout:10000});
  const final=await a.evaluate(async()=> (await(await fetch('/api/campus/games?table=boxes')).json()).game);
  expect(final.state.scores.reduce((a,b)=>a+b)).toBe(16);
  await a.screenshot({path:join(directory,'board-boxes-four-player-fullscreen.png')});result.screenshots.push(join(directory,'board-boxes-four-player-fullscreen.png'));
  await pages[3].screenshot({path:join(directory,'board-boxes-phone.png')});result.screenshots.push(join(directory,'board-boxes-phone.png'));
  await dialog(a).getByRole('button',{name:'Return to school →',exact:true}).click();
  await a.getByRole('button',{name:'Study desk',exact:true}).click();await a.getByRole('button',{name:'Open Study Hub',exact:true}).click();
  await expect(a.frameLocator('iframe[title="Your Academy course"]').getByLabel('Practice answer')).toHaveValue('board-games-retained-course-canary');
  await a.getByRole('button',{name:'Return to school →',exact:true}).click();
  await open(a,'boxes');await dialog(a).getByText('Report or block a player',{exact:true}).click();await dialog(a).getByRole('button',{name:'Report FriendTwo',exact:true}).click();await dialog(a).getByRole('alert').filter({hasText:'Report saved'}).waitFor();
  await dialog(a).getByRole('button',{name:'Block FriendTwo',exact:true}).click();
  await dialog(a).getByLabel('Game username',{exact:true}).waitFor();await dialog(b).getByLabel('Game username',{exact:true}).waitFor();
  for(const page of pages.slice(2)){await dialog(page).getByRole('button',{name:'Leave table',exact:true}).click();await dialog(page).getByLabel('Game username',{exact:true}).waitFor();}
  expect((await store.db.query('SELECT count(*) AS n FROM campus_game_members')).rows[0].n).toBe(0);
  result.checks.push('Four actual browser contexts complete Dots & Boxes with shared scores/turns, fullscreen and phone layout; course input is retained, report/block works and all game identities are cleaned');
  for(const context of contexts)await context.close();
}
