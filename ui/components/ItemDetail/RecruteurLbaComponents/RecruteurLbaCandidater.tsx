"use client"
import type { ILbaItemLbaCompanyJson } from "shared"
import { CandidaterButton } from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/CandidaterButton"
import { CandidatureLbaModal } from "@/components/ItemDetail/CandidatureLba/CandidatureLbaModal"

export function RecruteurLbaCandidater({ item }: { item: ILbaItemLbaCompanyJson }) {
  return <CandidaterButton item={item} buttonLabel={"J'envoie ma candidature spontanée"} CandidaterModal={CandidatureLbaModal} />
}
