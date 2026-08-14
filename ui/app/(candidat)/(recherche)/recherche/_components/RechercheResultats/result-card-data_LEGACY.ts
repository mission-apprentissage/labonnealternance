import type { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/use-recherche-results"
import type { IWhisper } from "@/app/(candidat)/(recherche)/recherche/_hooks/use-whispers_LEGACY"

export type ResultCardILba = {
  type: "lba_item"
  value: ILbaItem
}

export type ResultCardData =
  | ResultCardILba
  | {
      type: "whisper"
      value: IWhisper
    }
  | {
      type: "ValorisationCandidatureSpontanee"
    }
