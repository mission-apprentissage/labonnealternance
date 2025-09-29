"use client"
import { ILbaItemLbaJobJson } from "shared"

import { CandidaterButton } from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/CandidaterButton"

import { CandidatureLbaModal } from "./CandidatureLbaModal"

export function CandidatureLba({ item }: { item: ILbaItemLbaJobJson }) {
  return <CandidaterButton item={item} buttonLabel={"J'envoie ma candidature"} CandidaterModal={CandidatureLbaModal} />
}
