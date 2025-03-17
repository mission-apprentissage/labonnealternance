"use client"

import { useParams } from "next/navigation"

import ListeOffres from "@/app/(espace-pro)/espace-pro/(connected)/_components/ListeOffres"
import { Layout } from "@/components/espace_pro"

//TODO doit contenir la liste des offres de la société administré par l'opco sélectionnée

export default function EntrepriseJobList() {
  const { establishment_id } = useParams() as { establishment_id: string }

  return (
    <Layout footer={false}>
      <ListeOffres hideModify={true} establishment_id={establishment_id} />
    </Layout>
  )
}
