import { fr } from "@codegouvfr/react-dsfr"
import { Stack, Typography } from "@mui/material"
import Image from "next/image"
import type { ILbaItemFormation2Json, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson } from "shared"
import { UNKNOWN_COMPANY } from "shared/constants/lbaitem"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { getCompanyGoogleSearchLink } from "./getCompanyGoogleSearchLink"

export default function ItemGoogleSearchLink({ item }: { item: ILbaItemFormation2Json | ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemFtJobJson }) {
  return (
    item.company.name !== UNKNOWN_COMPANY && (
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          pt: fr.spacing("2v"),
        }}
      >
        <Image src="/images/icons/magnifyingglass.svg" alt="" aria-hidden={true} width={24} height={24} style={{ marginRight: fr.spacing("2v") }} />
        <Typography component="span">
          Lancer une recherche Google sur{" "}
          <DsfrLink href={getCompanyGoogleSearchLink(item)} aria-label="Recherche de l'entreprise sur google.fr - nouvelle fenêtre">
            {item.company.name}
          </DsfrLink>
        </Typography>
      </Stack>
    )
  )
}
