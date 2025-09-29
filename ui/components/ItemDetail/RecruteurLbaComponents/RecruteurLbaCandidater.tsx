"use client"
import { ILbaItemLbaCompanyJson } from "shared"

import { hasValidEmail } from "@/app/(candidat)/(recherche)/recherche/_components/hasValidEmail"
import { CandidaterButton } from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/CandidaterButton"
import { CandidatureLbaModal } from "@/components/ItemDetail/CandidatureLba/CandidatureLbaModal"
import { RecruteurLbaNoContactModal } from "@/components/ItemDetail/RecruteurLbaComponents/RecruteurLbaNoContactModal"

export function RecruteurLbaCandidater({ item }: { item: ILbaItemLbaCompanyJson }) {
  const CandidaterModal = hasValidEmail(item) ? CandidatureLbaModal : RecruteurLbaNoContactModal
  return <CandidaterButton item={item} buttonLabel={"J'envoie ma candidature spontanée"} CandidaterModal={CandidaterModal} />
}
