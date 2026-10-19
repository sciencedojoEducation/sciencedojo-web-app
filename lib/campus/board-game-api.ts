import {GAME_TABLES, gameUsername, newBoard, playBoard, type GameKind, type GameSnapshot} from "./board-games.ts";
import {sameOrigin, readCampusJson} from "./security.ts";
import {allowedGamePhoto, readGamePhoto} from "./board-game-photo.ts";

type RpcResult = GameSnapshot & {error?: string; photo?: string; target?: string};
export type GamesSession = {userId: string; profile: {full_name: string | null; avatar_url: string | null};
  safety: (action: string, target: string, reason?: string) => Promise<boolean>};
export type GameApiDependencies = {
  session: () => Promise<GamesSession | null>;
  rpc: (user: string, table: GameKind, operation: string, payload?: object) => Promise<RpcResult>;
  supabaseUrl?: string; fetchPhoto?: typeof fetch;
};
const headers = {"Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff", "Vary":"Cookie"};
const json = (value: unknown, status = 200) => Response.json(value, {status, headers});
export function createGameApi(deps: GameApiDependencies) {
  async function handle(request: Request, photo = false) {
    if ((request.method !== "GET" && request.method !== "POST") ||
      (request.method === "POST" && !sameOrigin(request)) ||
      request.headers.get("sec-fetch-site") === "cross-site" ||
      (request.headers.has("origin") && !sameOrigin(request))) return json({error:"Origin denied"},403);
    const url = new URL(request.url), table = url.searchParams.get("table");
    if (!GAME_TABLES.some(t => t.id === table)) return json({error:"Choose a game table"},400);
    const kind = table as GameKind;
    try {
      const session = await deps.session();
      if (!session) return json({error:"Campus access required"},403);
      const rpc = (operation: string, payload: object = {}) => deps.rpc(session.userId, kind, operation, payload);
      // A database check also covers real notice, confirmed account and revocation.
      const current = await rpc("read");
      if (current.error) return json({error:current.error},403);
      if (photo) {
        const player = url.searchParams.get("player");
        if (!player || (player !== "self" && !/^[0-9a-f-]{36}$/i.test(player))) return json({error:"Player unavailable"},404);
        const source = player === "self" ? session.profile.avatar_url : (await rpc("photo",{player})).photo;
        const destination = allowedGamePhoto(source,deps.supabaseUrl);
        if (!destination) return json({error:"Picture unavailable"},404);
        const image = await readGamePhoto(destination,deps.fetchPhoto);
        // Membership/blocks could change during the bounded upstream request.
        const checked = await rpc(player === "self" ? "read" : "photo",{player});
        if (checked.error || !image || (player !== "self" && checked.photo !== source)) return json({error:"Picture unavailable"},404);
        return new Response(new Uint8Array(image.bytes),{headers:{...headers,"Content-Type":image.type,"Content-Security-Policy":"default-src 'none'; sandbox","Cross-Origin-Resource-Policy":"same-origin"}});
      }
      if (request.method === "GET") return json({game:current, profile:{
        username:gameUsername(session.profile.full_name) ?? "Player",
        photo:!!allowedGamePhoto(session.profile.avatar_url,deps.supabaseUrl)}});
      const body = await readCampusJson(request);
      if (!body || typeof body.action !== "string") return json({error:"Invalid game request"},400);
      const keys: Record<string,string[]> = {join:["action","username"],ready:["action","ready","round","version"],
        start:["action","round","version"],move:["action","move","round","version"],leave:["action"],
        block:["action","player"],report:["action","player","reason"]};
      const allowed = keys[body.action];
      if (!allowed || Object.keys(body).some(k => !allowed.includes(k))) return json({error:"Invalid game request"},400);
      let result: RpcResult;
      if (body.action === "join") {
        const username = gameUsername(body.username);
        if (!username) return json({error:"Choose a username of 1–24 letters, numbers, spaces, dots, dashes or underscores"},400);
        result = await rpc("join",{username});
      } else if (body.action === "leave") result = await rpc("leave");
      else if (body.action === "block" || body.action === "report") {
        if (typeof body.player !== "string" || !current.members.some(m => m.id === body.player && m.id !== current.self) ||
          (body.action === "report" && !["harassment","inappropriate-behaviour","technical","other"].includes(String(body.reason)))) return json({error:"Player unavailable"},400);
        const target = await rpc("target",{player:body.player});
        if (!target.target || !await session.safety(body.action,target.target,body.reason as string)) return json({error:"Unable to save. Contact your session supervisor."},400);
        result = await rpc("read");
      } else {
        if (!current.self) return json({error:"Join this table first"},403);
        if (body.round !== current.round || (body.action!=="ready" && body.version !== current.version)) return json({error:"The table changed. Try again."},409);
        const stamp = {round:body.round,version:body.version};
        if (body.action === "ready") {
          if (typeof body.ready !== "boolean") return json({error:"Invalid ready state"},400);
          result = await rpc("ready",{...stamp,ready:body.ready});
        } else {
          let state;
          try {
            if (body.action === "start") {
              if (current.state?.phase === "playing" || !current.members.every(m => m.ready)) throw new Error("Wait for every player to be ready.");
              state = newBoard(kind,current.members.map(m => m.id));
            } else {
              if (!current.state) throw new Error("Start a round first.");
              state = playBoard(current.state,current.self,body.move as number);
            }
          } catch (error) {return json({error:error instanceof Error ? error.message : "Invalid move"},400);}
          result = await rpc("commit",{...stamp,state,start:body.action === "start"});
        }
      }
      return result.error ? json({error:result.error},409) : json({game:result});
    } catch {return json({error:"Games are temporarily unavailable. Your course work is retained."},503);}
  }
  return {GET:(request:Request) => handle(request),POST:(request:Request) => handle(request),PHOTO:(request:Request) => handle(request,true)};
}
