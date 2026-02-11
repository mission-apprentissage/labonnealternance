import { fr } from "@codegouvfr/react-dsfr"
import { Box, Divider, Grid, Typography } from "@mui/material"

import Image from "next/image"
import Card from "@codegouvfr/react-dsfr/Card"
import type { Metadata } from "next"
import { ARTICLES } from "./const"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PAGES } from "@/utils/routes.utils"
import { AllerPlusLoinItem } from "@/app/(editorial)/_components/AllerPlusLoinItem"
import { AllerPlusLoinItemHorizontal } from "@/app/(editorial)/_components/AllerPlusLoinItemHorizontal"
import { Conseil } from "@/app/(editorial)/_components/Conseil"
import { QuizItem } from "@/app/(editorial)/_components/QuizItem"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { DsfrIcon } from "@/components/DsfrIcon"
import { GuideHeaderIllustration } from "@/app/(editorial)/_components/GuideHeaderIllustration"

export const metadata: Metadata = PAGES.static.guideAlternant.getMetadata()

const GuideAlternantPage = () => {
  return (
    <Box
      sx={{
        mb: fr.spacing("3w"),
      }}
    >
      <Breadcrumb pages={[PAGES.static.guideAlternant]} />
      <DefaultContainer>
        <Box display={{ md: "flex", xs: "none" }}>
          <GuideHeaderIllustration />
        </Box>
        <Box my={{ md: fr.spacing("4v") }}>
          <Grid container spacing={4} p={{ md: fr.spacing("6v") }} sx={{ position: "relative", zIndex: 2 }}>
            <Grid size={{ md: 7, xs: 12 }} gap={2} display={"flex"} flexDirection={"column"}>
              <Typography component={"h1"} variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default }} gutterBottom>
                Ressources alternant
              </Typography>
              <Typography component={"p"} variant="body1" display={{ md: "block", xs: "none" }}>
                La bonne alternance vous propose un ensemble d’informations et d’outils pour vous aider dans vos démarches de recherche de formation et d’emploi en alternance.
              </Typography>
            </Grid>
          </Grid>
        </Box>
        <Grid container spacing={2}>
          <Grid size={12} my={fr.spacing("6v")}>
            <Typography component="h2" variant="h2">
              Tout savoir sur l'alternance
            </Typography>
            <Divider
              sx={{ width: fr.spacing("16v"), height: 0, background: "none", borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}` }}
            />
          </Grid>
          <Grid
            container
            size={12}
            sx={{
              "& .fr-card__content": {
                padding: fr.spacing("3w"),
              },
              "& .fr-card__end": {
                display: "none",
                padding: 0,
              },
            }}
          >
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["decouvrir-l-alternance"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["preparer-son-projet-en-alternance"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["apprentissage-et-handicap"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["comment-signer-un-contrat-en-alternance"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["la-rupture-de-contrat"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["se-faire-accompagner"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["prevention-des-risques-professionnels-pour-les-apprentis"]} />
            </Grid>
          </Grid>
          <Grid size={12} my={fr.spacing("6v")}>
            <Typography component="h2" variant="h2">
              La rémunération en alternance
            </Typography>
            <Divider
              sx={{ width: fr.spacing("16v"), height: 0, background: "none", borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}` }}
            />
          </Grid>
          <Grid size={{ md: 6, xs: 12 }}>
            <AllerPlusLoinItemHorizontal {...ARTICLES["comprendre-la-remuneration"]} />
          </Grid>
          <Grid size={{ md: 6, xs: 12 }}>
            <AllerPlusLoinItemHorizontal {...ARTICLES["simulateur"]} />
          </Grid>
          <Grid size={12} my={fr.spacing("6v")}>
            <Typography component="h2" variant="h2">
              Encore plus de conseils et astuces
            </Typography>
            <Divider
              sx={{ width: fr.spacing("16v"), height: 0, background: "none", borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}` }}
            />
          </Grid>
          <Conseil title="À propos des formations en alternance" icon="ri-graduation-cap-line" href={PAGES.static.guideAlternantAProposDesFormations.getPath()} />
          <Conseil
            title="Pour trouver un employeur et préparer vos candidatures"
            icon="fr-icon-briefcase-line"
            href={PAGES.static.guideAlternantConseilsEtAstucesPourTrouverUnEmployeur.getPath()}
          />
          <Conseil
            title="À propos des aides financières et matérielles"
            icon="fr-icon-calculator-line"
            href={PAGES.static.guideAlternantLesAidesFinancieresEtMaterielles.getPath()}
          />
          <Grid
            container
            size={12}
            sx={{
              backgroundColor: fr.colors.decisions.background.default.grey.hover,
              borderRadius: fr.spacing("2v"),
              "& .fr-card__content": {
                paddingTop: fr.spacing("3w"),
                paddingBottom: fr.spacing("4w"),
              },
              "& .fr-card__title ::after": {
                display: "none",
              },
              padding: { md: fr.spacing("4w"), xs: fr.spacing("2w") },
              marginTop: fr.spacing("4w"),
            }}
          >
            <Grid size={12}>
              <Typography component={"h2"} variant="h2">
                Testez vos connaissances
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography component={"span"} variant="body1">
                4 quiz interactifs pour vous préparer à 4 moments clé de la recherche d'alternance :
              </Typography>
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <QuizItem
                title="Vous recherchez une formation ?"
                desc="Préparez-vous à échanger avec une école"
                href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <QuizItem
                title="Vous recherchez un employeur ?"
                desc="Apprenez à bien cibler les entreprises"
                href="https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e"
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <QuizItem
                title="Vous avez bientôt un entretien d'embauche ?"
                desc="Entraînez-vous pour avoir plus de chances de réussite"
                href="https://dinum.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <QuizItem
                title="Vous allez bien démarrer votre contrat ?"
                desc="Familiarisez-vous avec la posture à adopter en entreprise"
                href="https://dinum.didask.com/courses/demonstration/6283bd5ad9c7ae00003ede91"
              />
            </Grid>
          </Grid>
          <Grid
            container
            size={12}
            sx={{
              backgroundColor: fr.colors.decisions.background.default.grey.hover,
              borderRadius: fr.spacing("2v"),
              padding: { md: fr.spacing("4w"), xs: fr.spacing("1w") },
              marginTop: fr.spacing("4w"),
            }}
            spacing={2}
          >
            <Grid size={12} my={fr.spacing("6v")}>
              <Typography component="h2" variant="h2">
                Liens et documents utiles
              </Typography>
              <Divider
                sx={{ width: fr.spacing("16v"), height: 0, background: "none", borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}` }}
              />
            </Grid>
            <Grid
              container
              size={12}
              mx={{ md: fr.spacing("4w"), xs: fr.spacing("1w") }}
              padding={{ md: fr.spacing("3w"), xs: fr.spacing("2w") }}
              sx={{ backgroundColor: "white" }}
            >
              <Grid size={{ md: 4, xs: 0 }} alignContent={"center"}>
                <Image src="/images/guides/guide-alternant/tableau-de-suivi.svg" width={222} height={175} alt="" />
              </Grid>
              <Grid size={{ md: 8, xs: 12 }}>
                <Box display={"flex"} flexDirection={"column"} gap={fr.spacing("4v")}>
                  <Typography component={"h3"} variant="h6">
                    Suivre ses candidatures est essentiel pour penser à relancer à temps les recruteurs et savoir quelles entreprises ont déjà été contactées.
                  </Typography>
                  <Typography component={"p"} variant="body2">
                    Pour vous aider dans le suivi de vos candidatures, La bonne alternance vous propose un exemple de tableau :
                  </Typography>
                  <Box display={"flex"} flexDirection={"column"} gap={fr.spacing("3v")}>
                    <Box>
                      <DsfrLink
                        href={"/ressources/Tableau-de-suivi-des-candidatures-a-imprimer_La-bonne-alternance_PDF.pdf"}
                        external
                        aria-label="Télécharger le tableau de suivi des candidatures au format PDF"
                      >
                        <DsfrIcon name="fr-icon-file-download-line" size={16} />
                        Tableau de suivi à imprimer - PDF
                      </DsfrLink>
                      <Typography component={"span"} variant="caption" mt={"auto"} ml={fr.spacing("1w")}>
                        (3.9 Mo)
                      </Typography>
                    </Box>
                    <Box>
                      <DsfrLink
                        href={"/ressources/Tableau-de-suivi-des-candidatures-a-imprimer_La-bonne-alternance_Excel.xlsx"}
                        external
                        aria-label="Télécharger le tableau de suivi des candidatures au format Excel"
                      >
                        <DsfrIcon name="fr-icon-file-download-line" size={16} />
                        Tableau de suivi à imprimer - Excel
                      </DsfrLink>
                      <Typography component={"span"} variant="caption" mt={"auto"} ml={fr.spacing("1w")}>
                        (12 ko)
                      </Typography>
                    </Box>
                    <Box>
                      <DsfrLink
                        href={"/ressources/Tableau-de-suivi-des-candidatures-a-imprimer_La-bonne-alternance_Numbers.numbers"}
                        external
                        aria-label="Télécharger le tableau de suivi des candidatures au format Numbers"
                      >
                        <DsfrIcon name="fr-icon-file-download-line" size={16} />
                        Tableau de suivi à imprimer - Numbers
                      </DsfrLink>
                      <Typography component={"span"} variant="caption" mt={"auto"} ml={fr.spacing("1w")}>
                        (788 ko)
                      </Typography>
                    </Box>
                    <Box>
                      <DsfrLink
                        href={"/ressources/Tableau-de-suivi-des-candidatures-a-imprimer_La-bonne-alternance_LibreOffice.ods"}
                        external
                        aria-label="Télécharger le tableau de suivi des candidatures au format LibreOffice"
                      >
                        <DsfrIcon name="fr-icon-file-download-line" size={16} />
                        Tableau de suivi à imprimer - Libre office
                      </DsfrLink>
                      <Typography component={"span"} variant="caption" mt={"auto"} ml={fr.spacing("1w")}>
                        (29 ko)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            <Grid
              size={12}
              mx={{ md: fr.spacing("4w"), xs: fr.spacing("1w") }}
              sx={{
                backgroundColor: "white",
                "& .fr-card__content": {
                  paddingTop: fr.spacing("2w"),
                  paddingBottom: fr.spacing("4w"),
                },
                "& .fr-card__end": {
                  display: "none",
                },
                "& .fr-card__title ::after": {
                  display: "none",
                },
              }}
            >
              <Card
                title={
                  <Box display={"flex"} gap={fr.spacing("3w")}>
                    <Image src={"/images/guides/guide.svg"} width={40} height={40} alt="" />
                    <Box display="flex" flexDirection={"column"}>
                      <Typography component="span" variant="body1" color={fr.colors.decisions.text.title.blueFrance.default} fontWeight={700}>
                        Guide apprentissage et handicap
                      </Typography>
                      <Typography component="span" variant="body2" color={fr.colors.decisions.text.default.grey.default} fontSize={14}>
                        Un guide pour les employeurs
                      </Typography>
                    </Box>
                  </Box>
                }
                border
                style={{
                  borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.plain.blueFrance.default}`,
                }}
                linkProps={{
                  href: "https://travail-emploi.gouv.fr/apprentissage-et-handicap-un-guide-pour-les-employeurs-et-les-apprentis#Qu-est-ce-que-le-contrat-d-apprentissage-amenage",
                }}
              />
            </Grid>
          </Grid>
          <Grid size={12} my={fr.spacing("6v")}>
            <Typography component="h2" variant="h2">
              Encore plus de ressources
            </Typography>
            <Divider
              sx={{ width: fr.spacing("16v"), height: 0, background: "none", borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}` }}
            />
          </Grid>
          <Grid container size={12}>
            <Grid size={{ md: 6, xs: 12 }}>
              <Card
                title="Ressources recruteur"
                desc="Pour bien recruter et bien accueillir vos alternants"
                linkProps={{
                  href: PAGES.static.guideRecruteur.getPath(),
                }}
                enlargeLink
                shadow
              />
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <Card
                title="Ressources organisme de formation"
                desc="Des ressources pour vous et vos alternants"
                linkProps={{
                  href: PAGES.static.guideCFA.getPath(),
                }}
                enlargeLink
                shadow
              />
            </Grid>
          </Grid>

          <Grid container size={12} sx={{ backgroundColor: fr.colors.decisions.background.default.grey.hover, px: fr.spacing("3w"), py: fr.spacing("2w") }}>
            <Grid size={{ md: 10, xs: 12 }}>
              <Box display={"flex"} flexDirection={"column"} gap={fr.spacing("2w")} my={fr.spacing("2w")}>
                <Typography variant="body1" fontWeight={500}>
                  Vous avez une question sur le fonctionnement de notre plateforme ?
                </Typography>
                <Box>
                  <DsfrLink href={PAGES.static.faq.getPath()} aria-label="Consulter la foire aux questions">
                    Consulter la FAQ
                    <DsfrIcon name="fr-icon-arrow-right-line" size={16} ml={fr.spacing("2v")} marginRight={"0 !important"} />
                  </DsfrLink>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ md: 2, xs: 12 }}>
              <Image src="/images/guides/faq.svg" width={200} height={110} alt="" />
            </Grid>
          </Grid>
        </Grid>
      </DefaultContainer>
    </Box>
  )
}

export default GuideAlternantPage
