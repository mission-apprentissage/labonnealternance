import { fr } from "@codegouvfr/react-dsfr"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useEffect, useState } from "react"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { publicConfig } from "@/config.public"
import image from "@/public/assets/checkbox-list.webp"
import { getRomeDetail } from "@/utils/api"
import { type RomeCompetenceKey, RomeDetail } from "./RomeDetail"

const fakeLoadingDuration = 1000

export const RomeDetailWithQuery = ({
  rome,
  onChange,
  selectedCompetences,
  title,
}: {
  rome: string
  onChange: (selectedCompetences: Record<RomeCompetenceKey, Set<string>>) => void
  selectedCompetences: Record<RomeCompetenceKey, Set<string>>
  title: string
}) => {
  const [fakeLoading, setFakeLoading] = useState<{ id: string; isLoading: boolean }>({ id: new Date().toISOString(), isLoading: true })
  const {
    data: romeReferentiel,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["getRomeDetail", rome],
    queryFn: () => getRomeDetail(rome),
    retry: false,
  })

  useEffect(() => {
    const id = new Date().toISOString()
    setFakeLoading({ id, isLoading: true })
    const timeoutId = setTimeout(() => {
      setFakeLoading({ id, isLoading: false })
    }, fakeLoadingDuration)
    return () => clearTimeout(timeoutId)
  }, [rome, setFakeLoading])

  const setCompetenceSelection = (groupKey: RomeCompetenceKey, competence: string, selected: boolean) => {
    const group = selectedCompetences[groupKey]
    if (selected) {
      group.add(competence)
    } else {
      group.delete(competence)
    }
    onChange(selectedCompetences)
  }

  return isLoading || fakeLoading.isLoading ? (
    <LoadingBox />
  ) : error ? (
    <Box sx={{ border: "1px solid #000091", p: fr.spacing("6v") }}>
      <Typography variant="h4" sx={{ mb: fr.spacing("6v") }}>
        {title}
      </Typography>
      <Typography>
        La fiche métier n'a pas pu être trouvée, merci de le{" "}
        <DsfrLink
          aria-label="Envoi d'un email à l'équipe La bonne alternance - nouvelle fenêtre"
          href={`mailto:${publicConfig.publicEmail}?subject=Dépôt%20offre%20-%20ROME%20manquant-${title}`}
          external
        >
          signaler à notre équipe support
        </DsfrLink>{" "}
        en précisant le métier cherché
      </Typography>
    </Box>
  ) : (
    <RomeDetail title={title} romeReferentiel={romeReferentiel} onChange={setCompetenceSelection} selectedCompetences={selectedCompetences} />
  )
}

const LoadingBox = () => {
  return (
    <Box sx={{ border: "solid 1px #000091", height: "430px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column", width: "100%" }}>
        <Image src={image} width={80} alt="" />
        <Typography sx={{ fontWeight: 700, my: fr.spacing("6v") }}>Génération du descriptif de l’offre</Typography>
        <CircularProgress sx={{ mt: fr.spacing("6v") }} />
      </Box>
    </Box>
  )
}
