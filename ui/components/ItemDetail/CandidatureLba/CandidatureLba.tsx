"use client"
import type { ILbaItemLbaJobJson } from "shared"
import { CandidaterButton } from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/CandidaterButton"
import { CandidatureLbaModal } from "./CandidatureLbaModal"

export function CandidatureLba({ item, showScrollToTop }: { item: ILbaItemLbaJobJson; showScrollToTop?: boolean }) {
  return <CandidaterButton item={item} buttonLabel={"J'envoie ma candidature"} CandidaterModal={CandidatureLbaModal} showScrollToTop={showScrollToTop} />
}
