"use client"

import { useParams } from "next/navigation"

import { BackEntrepriseUpsertOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/BackEntrepriseUpsertOffre"

export const PageWithParams = ({ establishment_id }: { establishment_id: string }) => {
  const { job_id } = useParams() as { job_id: string }
  return <BackEntrepriseUpsertOffre establishment_id={establishment_id} job_id={job_id} />
}
