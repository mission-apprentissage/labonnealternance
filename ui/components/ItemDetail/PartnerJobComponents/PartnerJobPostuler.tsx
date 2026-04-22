"use client"

import type { ILbaItemPartnerJobJson } from "shared"
import { CandidaterButton } from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/CandidaterButton"
import { CandidatureLbaModal } from "@/components/ItemDetail/CandidatureLba/CandidatureLbaModal"
import CandidatureParTelephone from "@/components/ItemDetail/CandidatureParTelephone"
import PartnerJobExternalApply from "@/components/ItemDetail/PartnerJobComponents/PartnerJobExternalApply"

export const PartnerJobPostuler = ({ job }: { job: ILbaItemPartnerJobJson }) => {
  // KBA fix enum shared/models/lbaItem.model.ts
  if (["Pourvue", "Annulée"].includes(job.job.status)) return null
  if (job.contact?.hasEmail) {
    return <CandidaterButton item={job} buttonLabel={"J'envoie ma candidature"} CandidaterModal={CandidatureLbaModal} />
  }

  if (job.contact?.url) {
    return <PartnerJobExternalApply job={job} />
  }

  if (job.contact?.phone) {
    return <CandidatureParTelephone companyName={job.company.name || null} contactName={job.contact.name || null} contactPhone={job.contact.phone || null} />
  }

  return null
}
