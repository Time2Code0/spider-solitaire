import type { CardBackId, CardFrontId, Rank, Suit } from "./types";
import { RANK_CODES, SUIT_NAMES } from "./types";

export interface CardFrontMeta {
  description: string;
  dir?: string;
  id: CardFrontId;
  label: string;
  previewCode: string;
  renderMode: "img" | "sprite";
  spritePath?: string;
  viewBox: string;
}

export const CARD_FRONTS: Record<CardFrontId, CardFrontMeta> = {
  classic: {
    id: "classic",
    label: "Classic",
    description: "Bright, bold, ink-stamped feel",
    previewCode: "AS",
    renderMode: "img",
    dir: "/cards/classic",
    viewBox: "0 0 167 242",
  },
  vintage: {
    id: "vintage",
    label: "Vintage",
    description: "Traditional French court figures",
    previewCode: "spade_1",
    renderMode: "sprite",
    spritePath: "/cards/vintage/svg-cards.svg",
    viewBox: "0 0 169.075 244.64",
  },
  modern: {
    id: "modern",
    label: "Modern",
    description: "Crisp, high-contrast line work",
    previewCode: "AS",
    renderMode: "img",
    dir: "/cards/modern",
    viewBox: "0 0 240 336",
  },
};

export interface CardBackMeta {
  id: CardBackId;
  label: string;
  src: (front: CardFrontId) => string;
}

export const CARD_BACKS: Record<CardBackId, CardBackMeta> = {
  crimson: {
    id: "crimson",
    label: "Crimson",
    src: () => "/cards/backs/crimson.svg",
  },
  ocean: {
    id: "ocean",
    label: "Ocean",
    src: () => "/cards/backs/ocean.svg",
  },
  forest: {
    id: "forest",
    label: "Forest",
    src: () => "/cards/backs/forest.svg",
  },
  rosewood: {
    id: "rosewood",
    label: "Rosewood",
    src: () => "/cards/backs/rosewood.svg",
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    src: () => "/cards/backs/midnight.svg",
  },
  royal: {
    id: "royal",
    label: "Royal",
    src: () => "/cards/backs/royal.svg",
  },
};

export interface CardBackGroup {
  backs: CardBackId[];
  id: "classic" | "modern";
  label: string;
}

export const CARD_BACK_GROUPS: CardBackGroup[] = [
  {
    id: "classic",
    label: "Classic",
    backs: ["crimson", "ocean"],
  },
  {
    id: "modern",
    label: "Modern",
    backs: ["forest", "rosewood", "midnight", "royal"],
  },
];

export function cardCode(rank: Rank, suit: Suit): string {
  return `${RANK_CODES[rank]}${suit}`;
}

function vintageRankToken(rank: Rank): string {
  if (rank === 1) {
    return "1";
  }
  if (rank === 11) {
    return "jack";
  }
  if (rank === 12) {
    return "queen";
  }
  if (rank === 13) {
    return "king";
  }
  return String(rank);
}

export type FrontRenderDescriptor =
  | { mode: "img"; src: string; viewBox: string }
  | { mode: "sprite"; spritePath: string; id: string; viewBox: string };

export function describeFront(
  front: CardFrontId,
  rank: Rank,
  suit: Suit
): FrontRenderDescriptor {
  const meta = CARD_FRONTS[front];
  if (meta.renderMode === "sprite") {
    const suitName = SUIT_NAMES[suit];
    const rankToken = vintageRankToken(rank);
    return {
      mode: "sprite",
      spritePath: meta.spritePath as string,
      id: `${suitName}_${rankToken}`,
      viewBox: meta.viewBox,
    };
  }
  return {
    mode: "img",
    src: `${meta.dir}/${cardCode(rank, suit)}.svg`,
    viewBox: meta.viewBox,
  };
}

export function describeBack(
  front: CardFrontId,
  back: CardBackId
): { src: string; viewBox: string } {
  return {
    src: CARD_BACKS[back].src(front),
    viewBox: CARD_FRONTS[front].viewBox,
  };
}

export const CARD_FRONT_IDS: CardFrontId[] = ["classic", "vintage", "modern"];
export const CARD_BACK_IDS: CardBackId[] = CARD_BACK_GROUPS.flatMap(
  (group) => group.backs
);
