/** Pure server-authoritative rules. No account/profile data belongs in a board. */
import type {VocabularyView} from "./german-vocabulary.ts";
export type BoardKind = "four" | "boxes";
export type GameKind = BoardKind | "wortquest";
export type BoardState = {
  kind: BoardKind; phase: "playing" | "finished" | "abandoned";
  players: string[]; turn: number; board: number[]; boxes: number[];
  scores: number[]; winners: number[];
};
export const GAME_TABLES = [
  { id: "four", name: "Four in a Row", capacity: 2, x: 20.7, z: 28.3, floor: 2 },
  { id: "boxes", name: "Dots & Boxes", capacity: 4, x: 32.7, z: 28.3, floor: 2 },
  { id: "wortquest", name: "WortQuest", capacity: 4, x: 26.7, z: 28.3, floor: 2 },
] as const;
export function newBoard(kind: BoardKind, players: string[]): BoardState {
  if (!["four","boxes"].includes(kind) || players.length < 2 ||
    players.length > (kind === "four" ? 2 : 4) || new Set(players).size !== players.length)
    throw new Error("Two ready players are needed; Dots & Boxes supports up to four.");
  return {kind, phase: "playing", players: [...players], turn: 0,
    board: Array(kind === "four" ? 42 : 40).fill(-1),
    boxes: kind === "boxes" ? Array(16).fill(-1) : [],
    scores: players.map(() => 0), winners: []};
}
/** Horizontal edges 0..19 (row*4+col), then vertical 20..39 (row*5+col). */
export function boxEdges(box: number) {
  const row = Math.floor(box / 4), col = box % 4;
  return [row * 4 + col, (row + 1) * 4 + col, 20 + row * 5 + col, 21 + row * 5 + col];
}
export function playBoard(state: BoardState, player: string, move: number): BoardState {
  if (state.phase !== "playing" || state.players[state.turn] !== player)
    throw new Error("Wait for your turn.");
  if (!Number.isInteger(move) || move < 0 || move >= (state.kind === "four" ? 7 : 40))
    throw new Error("Choose a legal move.");
  const next: BoardState = {...state, board: [...state.board], boxes: [...state.boxes],
    scores: [...state.scores], winners: []};
  if (state.kind === "four") {
    let row = 5;
    while (row >= 0 && next.board[row * 7 + move] !== -1) row--;
    if (row < 0) throw new Error("That column is full.");
    next.board[row * 7 + move] = state.turn;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      let count = 1;
      for (const sign of [-1, 1]) {
        for (let n = 1; n < 4; n++) {
          const r = row + dr * n * sign, c = move + dc * n * sign;
          if (r < 0 || r > 5 || c < 0 || c > 6 || next.board[r * 7 + c] !== state.turn) break;
          count++;
        }
      }
      if (count >= 4) {next.phase = "finished"; next.winners = [state.turn]; next.scores[state.turn] = 1; return next;}
    }
    if (!next.board.includes(-1)) next.phase = "finished";
  } else {
    if (next.board[move] !== -1) throw new Error("That edge is already drawn.");
    next.board[move] = state.turn;
    let captured = 0;
    for (let b = 0; b < 16; b++) {
      if (next.boxes[b] === -1 && boxEdges(b).every(edge => next.board[edge] !== -1)) {
        next.boxes[b] = state.turn; next.scores[state.turn]++; captured++;
      }
    }
    if (!next.boxes.includes(-1)) {
      next.phase = "finished";
      const best = Math.max(...next.scores);
      next.winners = next.scores.flatMap((score, i) => score === best ? [i] : []);
    }
    if (captured) return next;
  }
  next.turn = (next.turn + 1) % state.players.length;
  return next;
}
export type GameMember = {id: string; username: string; ready: boolean; photo: boolean};
export type GameSnapshot = {
  table: GameKind; round: string; version: number; self: string | null;
  count: number; members: GameMember[]; state: BoardState | null; quiz?: VocabularyView | null; level?: string;
};
export function gameUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.normalize("NFKC").trim();
  return /^[\p{L}\p{N}][\p{L}\p{N} _.-]{0,23}$/u.test(clean) ? clean : null;
}
