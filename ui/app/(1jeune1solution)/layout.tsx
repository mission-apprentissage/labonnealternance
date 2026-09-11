import { fr } from "@codegouvfr/react-dsfr"
import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header"
import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Footer } from "@/app/_components/Footer"
import { footerId, mainId } from "@/app/_components/zone-ids"
import { DsfrHeaderProps1J1S } from "@/app/(1jeune1solution)/components/Header1J1S"
import InfoBanner from "@/components/InfoBanner/InfoBanner"
export default async function UnJeuneUneSolutionLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Contenu", anchor: `#${mainId("1jeune1solution")}` },
          { label: "Pied de page", anchor: `#${footerId("1jeune1solution")}` },
        ]}
      />
      <InfoBanner showInfo={false} showAlert={false} showOK={false} showEnvAlert={true} />
      <Box
        sx={{
          "& .fr-header, & .fr-header__body, & .fr-header__brand": {
            filter: "none",
            width: "unset",
          },
          "& .fr-header__navbar": {
            display: "none",
          },
          "& .fr-header__tools-links": {
            display: "block",
          },
          "& .fr-header__tools": {
            flex: 1,
            marginLeft: fr.spacing("3v"),
          },
          "& .fr-btns-group": { width: "100%" },
        }}
      >
        <DsfrHeader {...DsfrHeaderProps1J1S} />
      </Box>
      <Box component="main" role="main" id={mainId("1jeune1solution")} tabIndex={-1}>
        {children}
      </Box>
      <Footer zone="1jeune1solution" />
    </>
  )
}
