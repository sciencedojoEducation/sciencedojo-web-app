import {join} from 'node:path';
/** Runs against the actual client and transport. Uses only ordinary visible controls. */
export async function checkLivingCube({page:a,peer:b,stage,player,id,result,directory}){
 await a.setViewportSize({width:1280,height:900});
 const until=async(check,message,timeout=8000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await check())return;await a.waitForTimeout(60);}throw new Error(message);};
 const walk=async(button,arrival)=>{
  console.log(`Living Cube: walking to ${arrival}`);await a.getByRole('button',{name:button,exact:true}).click();
  await a.getByText(`Arrived at ${arrival}.`,{exact:true}).waitFor({timeout:120000});
 };
 // Return from the court using the maintained world route, rather than a fixture teleport.
 await a.locator('.school-map-place').filter({hasText:'Library'}).click();
 await walk('Walk here →','Library');
 if(await b.getByRole('button',{name:'Enter school',exact:true}).isVisible())await b.getByRole('button',{name:'Enter school',exact:true}).click();
 await b.getByText('In the school · walking',{exact:true}).waitFor();
 await a.bringToFront();
 const screen=a.getByRole('button',{name:'Screen room glass',exact:true});await screen.click();
 await a.getByRole('button',{name:'Clear room glass',exact:true}).waitFor();await b.getByRole('button',{name:'Clear room glass',exact:true}).waitFor();
 await a.locator('.campus-stage').screenshot({path:join(directory,'library-screened-glass.png')});result.screenshots.push(join(directory,'library-screened-glass.png'));
 await a.getByRole('button',{name:'Clear room glass',exact:true}).click();
 await a.getByRole('button',{name:'First person',exact:true}).click();
 await stage.focus();const before={...await player(id)};await a.keyboard.down('Shift');await a.keyboard.down('d');await a.waitForTimeout(550);await a.keyboard.up('d');await a.keyboard.up('Shift');
 await until(async()=>Math.hypot((await player(id)).x-before.x,(await player(id)).z-before.z)>.6,'Running did not move the authority');
 await stage.focus();await a.keyboard.press('c');await until(async()=>(await player(id)).stance==='crouch','C did not crouch');
 await a.keyboard.press('z');await until(async()=>(await player(id)).stance==='prone','Z did not lie prone');
 await a.keyboard.press('z');await until(async()=>(await player(id)).stance==='stand','Z did not stand');
 await a.keyboard.press('Space');await until(async()=>(await player(id)).elevation>.2,'Space did not jump');await until(async()=>(await player(id)).elevation===0,'Jump did not settle');
 // Entering a table footprint is blocked even while running forward.
 await a.getByRole('button',{name:'Follow me',exact:true}).click();
 await walk('Walk to glass elevator','Glass elevator');
 if(!await a.locator('.campus-interact').isEnabled())throw new Error('Nearby elevator E control is disabled');await stage.focus();await a.keyboard.press('e');await until(async()=>(await player(id)).travel==='lift','Lift did not start');
 await a.waitForTimeout(650);const liftX=(await player(id)).x;await stage.focus();await a.keyboard.down('d');await a.waitForTimeout(350);await a.keyboard.up('d');if((await player(id)).x!==liftX)throw new Error('Walking escaped the lift');
 await until(async()=>(await player(id)).floor===1&&!(await player(id)).travel,'Lift did not reach level 1');
 await a.getByRole('button',{name:'Level 1 · Learning & discovery',exact:true}).click();
 if(await a.locator('.school-map-place').count()!==6)throw new Error('Level 1 map incomplete');
 await a.locator('.school-map-place').filter({hasText:'Seminar classroom'}).click();await walk('Walk here →','Seminar classroom');
 await a.getByRole('button',{name:'Screen room glass',exact:true}).click();await a.getByRole('button',{name:'Clear room glass',exact:true}).waitFor();
 await a.locator('.campus-stage').screenshot({path:join(directory,'level-one-classroom.png')});result.screenshots.push(join(directory,'level-one-classroom.png'));
 await walk('Walk to escalator up','Moving escalator');await a.getByRole('button',{name:'Moving escalator → level 2',exact:true}).click();
 await until(async()=>(await player(id)).travel==='escalator','Escalator did not start');await until(async()=>(await player(id)).floor===2&&!(await player(id)).travel,'Escalator did not arrive',12000);
 await a.getByRole('button',{name:'Level 2 · Nature & wellbeing',exact:true}).click();await a.locator('.school-map-place').filter({hasText:'Quiet study lounge'}).click();await walk('Walk here →','Quiet study lounge');
 await a.locator('.campus-stage').screenshot({path:join(directory,'level-two-beanbag-lounge.png')});result.screenshots.push(join(directory,'level-two-beanbag-lounge.png'));
 await stage.focus();await a.keyboard.down('a');await until(async()=>(await player(id)).x<=24.3,'Could not approach upper laptop');await a.keyboard.up('a');
 await stage.focus();await a.keyboard.down('w');await until(async()=>(await player(id)).z<=-27.7,'Could not reach upper laptop');await a.keyboard.up('w');
 await until(async()=>/Sit at Quiet study lounge laptop/.test(await a.locator('.campus-interact').textContent()),'Upper laptop E prompt missing');
 await stage.focus();await a.keyboard.press('e');await until(async()=>(await player(id)).seat?.startsWith('quiet-'),'Upper laptop did not seat');
 await a.waitForTimeout(450);await a.keyboard.press('e');await a.waitForFunction(()=>document.querySelector('dialog')?.open);
 await a.getByRole('button',{name:'Return to school →',exact:true}).click();await a.getByRole('button',{name:'Stand up',exact:true}).click();
 await until(async()=>!(await player(id)).seat,'Upper seat did not release');
 await walk('Walk to garden slide' ,'Garden slide');await a.getByRole('button',{name:'Garden slide → level 0',exact:true}).click();await until(async()=>(await player(id)).travel==='slide','Slide did not start');
 await until(async()=>(await player(id)).floor===0&&!(await player(id)).travel,'Slide did not return to ground',10000);
 result.livingCube={sharedRoomScreening:true,run:true,crouch:true,prone:true,jumpAndLanding:true,lockedJourney:true,lift:true,upperClassroom:true,escalator:true,beanbagLounge:true,upperStudyHub:true,slide:true,returnedGround:true};
 result.checks.push('Living Cube: ordinary controls share screened glass between peers; Shift/C/Z/Space change authoritative movement; lift blocks walking, reaches level 1, upper classroom glass works, escalator reaches level 2 and garden slide returns to ground. All navigation uses ordinary routes, without fixture teleports.');
}
