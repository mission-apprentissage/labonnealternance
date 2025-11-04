"use client"
import type { ILbaItemLbaJobJson } from "shared"

import { CandidatureLbaModal } from "./CandidatureLbaModal"
import { CandidaterButton } from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/CandidaterButton"

export function CandidatureLba({ item }: { item: ILbaItemLbaJobJson }) {
  return <CandidaterButton item={item} buttonLabel={"J'envoie ma candidature"} CandidaterModal={CandidatureLbaModal} />
}
