"use client"
import type { ILbaItemLbaCompanyJson } from "shared"

import { RecruteurLbaNoContactModal } from "./RecruteurLbaNoContactModal"
import { hasValidEmail } from "@/app/(candidat)/(recherche)/recherche/_components/hasValidEmail"
import { CandidaterButton } from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/CandidaterButton"
import { CandidatureLbaModal } from "@/components/ItemDetail/CandidatureLba/CandidatureLbaModal"

export function RecruteurLbaCandidater({ item }: { item: ILbaItemLbaCompanyJson }) {
  const CandidaterModal = hasValidEmail(item) ? CandidatureLbaModal : RecruteurLbaNoContactModal
  return <CandidaterButton item={item} buttonLabel={"J'envoie ma candidature spontanée"} CandidaterModal={CandidaterModal} />
}
