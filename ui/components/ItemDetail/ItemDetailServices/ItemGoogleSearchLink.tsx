import { Stack, Typography } from "@mui/material"
import Image from "next/image"
import type { ILbaItemFormation2Json, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson } from "shared"
import { UNKNOWN_COMPANY } from "shared/constants/lbaitem"

import { fr } from "@codegouvfr/react-dsfr"
import { getCompanyGoogleSearchLink } from "./getCompanyGoogleSearchLink"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

export default function ItemGoogleSearchLink({ item }: { item: ILbaItemFormation2Json | ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemFtJobJson }) {
  return (
    item.company.name !== UNKNOWN_COMPANY && (
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          mt: fr.spacing("8v"),
        }}
      >
        <Image src="/images/icons/magnifyingglass.svg" alt="" aria-hidden={true} width={24} height={24} style={{ marginRight: "16px" }} />
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
