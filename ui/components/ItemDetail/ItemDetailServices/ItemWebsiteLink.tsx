import { fr } from "@codegouvfr/react-dsfr"
import { Stack, Typography } from "@mui/material"
import Image from "next/image"
import type { ILbaItemFormation2Json, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

export default function ItemWebsiteLink({ item }: { item: ILbaItemFormation2Json | ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemFtJobJson | ILbaItemPartnerJobJson }) {
  return "url" in item.company && item?.company?.url ? (
    <Stack direction="row" alignItems="center" sx={{ mt: fr.spacing("8v") }}>
      <Image src="/images/icons/world.svg" alt="" aria-hidden={true} width={24} height={24} style={{ marginRight: "16px" }} />
      <Typography component="span">
        Plus d'info sur l'entreprise{" "}
        <DsfrLink href={item?.company?.url} aria-label="Recherche de l'entreprise sur google.fr - nouvelle fenêtre">
          {item?.company?.url}
        </DsfrLink>
      </Typography>
    </Stack>
  ) : null
}
