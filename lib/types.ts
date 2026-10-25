export type DrawView = {
  id: string;
  dare: { text: string };
  victimId: string | null;
  drawnById: string | null;
  /** null when the jar is anonymous or the slip came from a starter pack */
  authorId: string | null;
  fromPack: boolean;
  outcome: "pending" | "done" | "chicken" | "veto" | "redraw";
  vetoVotes: string[];
  createdAt: number;
  resolvedAt: number | null;
  /** set when someone changed the result afterwards */
  editedBy: string | null;
};

export type PlayerView = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: "host" | "player";
  score: number;
  online: boolean;
  /** slips this player has waiting in the jar; null in anonymous jars */
  slips: number | null;
};

export type JarState = {
  /** bumps on every change to the jar */
  version: number;
  /** server clock, to tell fresh draws from old ones */
  now: number;
  jar: {
    id: string;
    code: string;
    name: string;
    emoji: string;
    maxPlayers: number;
    anonymous: boolean;
    noOwnDares: boolean;
    locked: boolean;
    ended: boolean;
    hasPassword: boolean;
  };
  me: { id: string; role: "host" | "player" };
  players: PlayerView[];
  slips: { id: string; color: string }[];
  myDares: { id: string; text: string; status: "in_jar" | "drawn" | "done" | "vetoed" }[];
  draw: DrawView | null;
  history: DrawView[];
};

export type JarPeek = {
  code: string;
  name: string;
  emoji: string;
  taken: number;
  maxPlayers: number;
  needsPassword: boolean;
  locked: boolean;
  ended: boolean;
  member: boolean;
  takenAvatars: string[];
};
