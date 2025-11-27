import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React from "react"
import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { PAGES } from "@/utils/routes.utils"

const CandidatureLbaWorked = ({ email, item }: { email: string; item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson }) => {
  const router = useRouter()

  const searchParams = new URL(window.location.href).searchParams
  const rechercheParams = parseRecherchePageParams(searchParams, IRechercheMode.DEFAULT)

  const company = item.company?.name
  const ideaType = item.ideaType
  return (
    <Box sx={{ px: fr.spacing("4w"), pb: "34px" }}>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", my: 4 }}>
        <Image src="/images/icons/coche_verte.svg" aria-hidden={true} alt="" width={23} height={23} />
        <Box sx={{ ml: 2 }}>
          <Typography data-testid="application-success" variant="h2" sx={{ fontSize: "20px", fontWeight: 700 }}>
            Votre candidature a bien été envoyée à{" "}
            <Typography component="span" variant="h2">
              {company}
            </Typography>
          </Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: "18px" }}>
        Un e-mail de confirmation vous a été envoyé sur votre boite e-mail{" "}
        <Typography component="span" sx={{ fontWeight: 700, color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
          {email}
        </Typography>
      </Typography>
      <Typography sx={{ fontSize: "18px", mt: 4 }}>
        Si vous n&apos;avez pas reçu d&apos;email de confirmation d&apos;ici 24 heures, soumettez à nouveau votre candidature
      </Typography>
      {ideaType !== LBA_ITEM_TYPE.RECRUTEURS_LBA && rechercheParams.romes.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: "24px",
            marginTop: "24px",
            padding: "24px",
            backgroundColor: "#F5F5FE",
            flexDirection: {
              xs: "column",
              md: "row",
            },
          }}
        >
          <Image src="/images/dame_papier_coche_verte.svg" aria-hidden={true} alt="" width={110} height={102} />
          <Box>
            <Typography
              sx={{
                marginBottom: "24px",
                fontSize: "18px",
                lineHeight: "28px",
              }}
            >
              <b>
                Augmentez vos chances de trouver une alternance avec des <TagCandidatureSpontanee /> visibles en fin de résultats de recherche.
              </b>
              <br />
              60% des recrutements se font grâce à des candidatures spontanées.
            </Typography>
            <Button
              className="fr-icon-arrow-right-line fr-btn--icon-right"
              onClick={() => {
                const utmParams = new URLSearchParams()
                utmParams.append("utm_source", "lba")
                utmParams.append("utm_medium", "website")
                utmParams.append("utm_campaign", "lba_pop-in-confirmation-envoi-candidature-offre_promo-candidature-spontanee")
                router.push(
                  PAGES.dynamic
                    .recherche({
                      ...rechercheParams,
                      scrollToRecruteursLba: true,
                      activeItems: undefined,
                    })
                    .getPath() +
                    "&" +
                    utmParams
                )
              }}
            >
              Voir les candidatures spontanées
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default CandidatureLbaWorked
