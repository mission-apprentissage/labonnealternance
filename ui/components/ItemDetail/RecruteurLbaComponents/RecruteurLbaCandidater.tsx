"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import type { ILbaItemLbaCompanyJson } from "shared"
import { hasEmail } from "@/app/(candidat)/(recherche)/recherche/_components/hasEmail"
import { CandidaterButton } from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/CandidaterButton"
import { CandidatureLbaModal } from "@/components/ItemDetail/CandidatureLba/CandidatureLbaModal"

export function RecruteurLbaCandidater({ item }: { item: ILbaItemLbaCompanyJson }) {
  const emailAvailable = hasEmail(item)
  if (!emailAvailable) {
    return (
      <Typography
        component="span"
        sx={{
          backgroundColor: "#FEECC2", // fr introuvable.
          color: fr.colors.decisions.background.actionHigh.greenTilleulVerveine.default,
          fontStyle: "italic",
        }}
        className={fr.cx("ri-spy-line", "fr-text--sm", "fr-icon--sm")}
      >
        {" "}
        Nous n’avons pas de contact pour cette entreprise, peut-être que vous en trouverez un sur internet !
      </Typography>
    )
  }
  return <CandidaterButton item={item} buttonLabel={"J'envoie ma candidature spontanée"} CandidaterModal={CandidatureLbaModal} />
}
