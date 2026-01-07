import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography, Stack, List, ListItem } from "@mui/material"
import Image from "next/image" // Ou <img> classique si tu ne veux pas NextImage

import ConseilsEtAstuces from "./conseilsEtAstuces"
import FonctionnementPlateforme from "./fonctionnementPlateforme"
import MisesEnSituation from "./misesEnSituation"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

const RessourcesCandidat = () => {
  return (
    <Box>
      <Typography>
        La bonne alternance vous propose un ensemble d’outils et de liens pour vous aider dans vos démarches de recherche de formation et d’emploi en alternance.
      </Typography>
      <Typography component="h2" variant="h4" sx={{ my: fr.spacing("3w") }}>
        Testez vos connaissances
      </Typography>
      <Typography>Entraînez-vous avec nos 4 parcours de mise en situation :</Typography>
      <MisesEnSituation target="candidat" />
      <Stack direction="row" sx={{ alignItems: "center", my: fr.spacing("3w") }}>
        <Image src="/images/pages_ressources/conseils et astuces.svg" width={32} height={32} alt="" aria-hidden="true" style={{ marginRight: fr.spacing("2w") }} />
        <Typography
          component="h2"
          variant="h4"
          sx={{
            fontWeight: 700,
          }}
        >
          Conseils et astuces
        </Typography>
      </Stack>
      <ConseilsEtAstuces />
      <Box sx={{ my: fr.spacing("5w") }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "center", md: "flex-start" },
            p: fr.spacing("3w"),
            boxShadow: "0px 0px 12px 6px #79797966",
          }}
        >
          <Image src="/images/pages_ressources/tableau de suivi.svg" width={64} height={64} alt="" aria-hidden="true" style={{ marginRight: fr.spacing("3w") }} />

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" sx={{ mb: fr.spacing("3w") }}>
                Suivre ses candidatures est essentiel pour penser à relancer à temps les recruteurs et savoir quelles entreprises ont déjà été contactées.
              </Typography>

              <Typography
                sx={{
                  mb: 2,
                }}
              >
                Pour vous aider dans le suivi de vos candidatures, La bonne alternance vous propose un exemple de tableau :
              </Typography>

              <List disablePadding>
                {[
                  { href: "/ressources/Tableau-de-suivi-des-candidatures-a-imprimer_La-bonne-alternance_PDF.pdf", label: "Tableau de suivi à imprimer - PDF" },
                  { href: "/ressources/Tableau-de-suivi-des-candidatures_La-bonne-alternance_Excel.xlsx", label: "Tableau de suivi - Excel" },
                  { href: "/ressources/Tableau-de-suivi-des-candidatures_La-bonne-alternance_Numbers.numbers", label: "Tableau de suivi - Numbers" },
                  { href: "/ressources/Tableau-de-suivi-des-candidatures_La-bonne-alternance_LibreOffice.ods", label: "Tableau de suivi - LibreOffice" },
                ].map((item) => (
                  <ListItem key={item.href} sx={{ pl: 0 }}>
                    <DsfrLink href={item.href} data-tracking-id="telecharger-fichier-suivi-candid">
                      <Stack
                        direction="row"
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <Image src="/images/icons/download_ico.svg" width={16} height={16} alt="" aria-hidden="true" style={{ marginRight: 8 }} />
                        {item.label}
                      </Stack>
                    </DsfrLink>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </Box>
      </Box>
      <FonctionnementPlateforme />
    </Box>
  )
}

export default RessourcesCandidat
