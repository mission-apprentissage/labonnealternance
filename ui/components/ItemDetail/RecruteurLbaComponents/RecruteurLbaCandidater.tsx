"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import type { ILbaItemJobsGlobal } from "shared"
import { hasEmail } from "@/app/(candidat)/(recherche)/recherche/_components/hasEmail"
import { CandidaterButton } from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/CandidaterButton"
import { CandidatureLbaModal } from "@/components/ItemDetail/CandidatureLba/CandidatureLbaModal"

export function RecruteurLbaCandidater({ item }: { item: ILbaItemJobsGlobal }) {
  const emailAvailable = hasEmail(item)
  if (!emailAvailable) {
    return (
      <Typography
        component="span"
        sx={{
          backgroundColor: "#FEECC2", // fr introuvable.
          color: fr.colors.decisions.background.actionHigh.greenTilleulVerveine.default,
          fontStyle: "italic",
          px: "6px",
          py: "2px",
        }}
        className={fr.cx("fr-text--sm")}
      >
        🕵️{" "}
        {item.contact.phone
          ? `Nous n’avons pas d’email pour cette entreprise, mais vous pouvez l’appeler au ${item.contact.phone} et demander s’ils recrutent des alternants !`
          : "Nous n’avons pas de contact pour cette entreprise, peut-être que vous en trouverez un sur internet !"}
      </Typography>
    )
  }
  return <CandidaterButton item={item} buttonLabel={"J'envoie ma candidature spontanée"} CandidaterModal={CandidatureLbaModal} />
}
