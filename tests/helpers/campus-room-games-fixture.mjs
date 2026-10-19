import {randomUUID} from 'node:crypto';
import {gameAccessKey,hashTicket} from '../../lib/campus/security.ts';
import {readFile} from 'node:fs/promises';
import {runtimeFixture} from './campus-runtime-fixture.mjs';
import {attachGamesApi} from './campus-games-fixture.mjs';
import {id} from './course-pilot-fixture.mjs';
export async function roomGamesFixture(transport='vercel'){
 const f=await runtimeFixture(6);
 for(const file of ['076_campus_board_games.sql','077_campus_german_vocabulary.sql','080_campus_room_games_invitations.sql'])await f.db.exec(await readFile(new URL('../../sql/'+file,import.meta.url),'utf8'));
 const keys=[],connections=[];
 for(let n=1;n<=6;n++){
  const raw=await f.issueRaw(n),connection=randomUUID();keys.push(gameAccessKey(raw));connections.push(connection);
  await f.runtime(connection,'connect',[],hashTicket(raw),f.members[n-1].id);
 }
 let stamp=Date.now();
 const context=async()=>transport==='vercel'?['vercel','{}']:['colyseus',JSON.stringify({at:stamp=Math.max(Date.now(),stamp+1),players:(await f.db.query(`SELECT p.campus_id AS id,replace(connection_id::text,'-','') AS connection,x,z,floor,status,seat,travel IS NOT NULL AS travel,k.credential FROM campus_presence p LEFT JOIN campus_play_keys k ON k.campus_id=p.campus_id AND k.connection=p.connection_id WHERE lease_until>clock_timestamp()`)).rows})];
 const attached=attachGamesApi(f,context);
 const pose=(n,x=21.7,z=28.3,floor=2)=>f.db.query("UPDATE campus_presence SET x=$2,z=$3,floor=$4,elevation=$4*12,seat=NULL,status='walking',travel=NULL,lease_until=clock_timestamp()+interval '1 hour' WHERE campus_id=$1",[f.members[n-1].id,x,z,floor]);
 for(let n=1;n<=6;n++)await pose(n);
 const game=(n,op='read',payload={},table='four')=>attached.rpc(id(n),table,op,payload,keys[n-1]);
 const play=(n,op='read',payload={})=>attached.playRpc(id(n),op,payload,keys[n-1]);
 return {...f,...attached,connections,keys,context,pose,game,play};
}
