import type { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import type { IWhisper } from "@/app/(candidat)/(recherche)/recherche/_hooks/useWhispers"

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
