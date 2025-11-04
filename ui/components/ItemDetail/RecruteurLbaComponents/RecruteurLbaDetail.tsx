import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, List, ListItem, Stack, Typography } from "@mui/material"
import Image from "next/image"
import { useContext, useEffect } from "react"
import type { ILbaItemLbaCompanyJson, ILbaItemNaf } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { DisplayContext } from "@/context/DisplayContextProvider"
import { SendPlausibleEvent } from "@/utils/plausible"
import { getCompanyGoogleSearchLink } from "@/components/ItemDetail/ItemDetailServices/getCompanyGoogleSearchLink"
import { getCompanySize } from "@/components/ItemDetail/ItemDetailServices/getCompanySize"
import ItemGoogleSearchLink from "@/components/ItemDetail/ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "@/components/ItemDetail/ItemDetailServices/ItemLocalisation"
import { ReportJobLink } from "@/components/ItemDetail/ReportJobLink"
import { LbaJobEngagement } from "@/components/ItemDetail/LbaJobComponents/LbaJobEngagement"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

const RecruteurLbaDetail = ({ recruteurLba }: { recruteurLba: ILbaItemLbaCompanyJson }) => {
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche emploi", {
      partner_label: recruteurLba.ideaType,
      info_fiche: `${recruteurLba?.company?.siret}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [recruteurLba?.company?.siret])

  useEffect(() => {
    // S'assurer que l'utilisateur voit bien le haut de la fiche au départ
    document.getElementsByClassName("choiceCol")[0]?.scrollTo(0, 0)
  }, []) // Utiliser le useEffect une seule fois : https://css-tricks.com/run-useeffect-only-once/

  const { formValues } = useContext(DisplayContext)

  return (
    <Box sx={{ mx: { xs: 0, md: "auto" }, maxWidth: "970px" }}>
      <Box sx={{ pt: 2, pb: 3, px: 3, position: "relative", bgcolor: "white", mt: fr.spacing("3w") }}>
        <Typography variant="h4" sx={{ mb: 2, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Comment fonctionne les candidatures spontanées La bonne alternance ?
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} display="flex" alignItems="center">
          <Typography>
            Nous sélectionnons pour vous des entreprises dont nous jugeons qu’il est possible qu’elles recrutent des alternants.
            <br />
            <strong>L’entreprise {recruteurLba?.company?.name} n’a pas déposé d’offre mais serait susceptible de recruter.</strong> Renseignez-vous sur ses activités et les métiers
            qu’elle exerce avant de soumettre votre candidature spontanée.
            <br />
            <br />
            <strong>Les candidats envoyant des candidatures spontanées ont plus de chance de trouver un employeur.</strong>
          </Typography>
          <Box px={fr.spacing("2w")} paddingTop={fr.spacing("2w")} paddingBottom={fr.spacing("1w")}>
            <Image style={{ minWidth: 194 }} src="/images/lba_recruteur_advice.svg" width={194} height={131} alt="" aria-hidden={true} />
          </Box>
        </Stack>
      </Box>

      <Box sx={{ mb: fr.spacing("2w") }}>{recruteurLba?.company?.elligibleHandicap && <LbaJobEngagement />}</Box>

      <Box sx={{ pt: 2, pb: 3, px: 3, position: "relative", bgcolor: "white", mt: fr.spacing("3w") }}>
        <Typography variant="h4" sx={{ mb: 2, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Comment candidater ?
        </Typography>

        <Accordion label="1. Renseignez-vous sur l’entreprise" defaultExpanded>
          <Box bgcolor="#f6f6f6" mb={2} p={2}>
            <Stack spacing={1}>
              <ItemLocalisation item={recruteurLba} />
              <Typography>
                <Typography component="span" fontWeight={700}>
                  Taille de l'entreprise :{" "}
                </Typography>
                <Typography component="span">{getCompanySize(recruteurLba)}</Typography>
              </Typography>
              <Typography>
                <Typography component="span" fontWeight={700}>
                  Secteur d'activité :{" "}
                </Typography>
                <Typography component="span">{(recruteurLba?.nafs as ILbaItemNaf[])?.[0].label}</Typography>
              </Typography>
              {recruteurLba?.contact?.phone && (
                <Typography>
                  <Typography component="span" fontWeight={700}>
                    Téléphone :{" "}
                  </Typography>
                  <Typography component="span">
                    <DsfrLink href={`tel:${recruteurLba.contact.phone}`} aria-label="Appeler la société au téléphone">
                      {recruteurLba.contact.phone}
                    </DsfrLink>
                  </Typography>
                </Typography>
              )}
              <ItemGoogleSearchLink item={recruteurLba} />
            </Stack>
          </Box>

          <Typography>
            Avant de candidater, il est indispensable de prendre le temps de vous renseigner sur les activités de l'entreprise.{" "}
            <DsfrLink href={getCompanyGoogleSearchLink(recruteurLba)} aria-label="Recherche de l'entreprise sur google.fr - nouvelle fenêtre">
              Démarrez une recherche
            </DsfrLink>{" "}
            et visitez son site internet. Posez-vous les questions suivantes :
          </Typography>
          <List sx={{ pl: 3, listStyleType: "disc", "& .MuiListItem-root": { display: "list-item" } }}>
            <ListItem>Est-ce que les activités de l’entreprise correspondent au métier que je souhaite exercer, en lien avec ma formation ?</ListItem>
            <ListItem>Pourquoi cette entreprise plutôt que ses concurrents ?</ListItem>
            <ListItem>Quelles compétences souhaiteriez-vous développer en intégrant cette entreprise ?</ListItem>
            <ListItem>Parmi mes qualités, lesquelles pourraient être utiles à cette entreprise ?</ListItem>
          </List>
        </Accordion>
        <Accordion label="2. Préparez votre candidature spontanée">
          <Typography>
            Après une recherche approfondie sur l'entreprise, personnalisez votre lettre de motivation en précisant tout d'abord pourquoi elle vous intéresse particulièrement : son
            domaine d'activité, ses valeurs, etc.
            <br />
            Mettez ensuite en avant vos qualités en lien avec le métier recherché. Puis terminez en exposant ce que vous pensez apporter à l'entreprise lors de votre alternance.
            Adaptez également votre CV.
            <br />
            <br />
            Pour cela, le service{" "}
            <DsfrLink href="https://diagoriente.beta.gouv.fr/" aria-label="Accéder au site de Diagoriente">
              Diagoriente
            </DsfrLink>{" "}
            vous aide à valoriser vos compétences sur votre CV sur la base de vos expériences et vos centres d'intérêt.
            <br />
            <br />
            Pour rendre votre CV plus beau et professionnel, vous pouvez utiliser ces outils gratuits :
          </Typography>
          <List sx={{ pl: 3, listStyleType: "disc", "& .MuiListItem-root": { display: "list-item" } }}>
            <ListItem>
              <DsfrLink href="https://cv.clicnjob.fr/" aria-label="Accéder au site cv.clicnjob.fr">
                https://cv.clicnjob.fr/
              </DsfrLink>
            </ListItem>
            <ListItem>
              <DsfrLink href="https://cvdesignr.com/fr" aria-label="Accéder au site cvdesignr.com">
                https://cvdesignr.com/fr
              </DsfrLink>
            </ListItem>
            <ListItem>
              <DsfrLink href="https://www.canva.com/fr_fr/creer/cv/" aria-label="Accéder au site www.canva.com pour créer un cv">
                https://www.canva.com/fr_fr/creer/cv/
              </DsfrLink>
            </ListItem>
          </List>
        </Accordion>
        <Accordion label="3. Anticiper la suite">
          <Typography>
            Une fois votre candidature envoyée, notez-vous un rappel pour pouvoir relancer l'entreprise dans 10 jours si vous n'avez pas de réponse d'ici là.
            <br />
            <br />
            <strong>Vous ne recevez pas de réponse ?</strong>
            <br />
            Voici un exemple de relance par téléphone :
            <br />
            <Typography component="span" py={4} fontStyle="italic" color="#6A6A6A">
              "Bonjour,
              <br />
              Je suis [Prénom Nom]. Je vous appelle car je vous ai envoyé ma candidature par mail le [jour/mois] pour un poste d'apprenti [intitulé du poste visé]. N'ayant pas reçu
              de réponse, je me permets de vous relancer car je suis vraiment très intéressé·e par votre entreprise. Je serai heureux·se de vous expliquer plus en détail ma
              motivation lors d'un rendez-vous. Pourriez-vous me dire à qui je dois m'adresser pour savoir où en est ma candidature et quand puis-je espérer recevoir une réponse ?"
            </Typography>
            <br />
            <br />
            <strong>Vous avez une proposition d'entretien ?</strong>
            <br />
            Préparez-vous avec ce quizz interactif :
          </Typography>
          <List sx={{ pl: 3, listStyleType: "disc", "& .MuiListItem-root": { display: "list-item" } }}>
            <ListItem>
              <DsfrLink
                href="https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
                aria-label="Accéder aux site de conseils didask pour préparer un entretient avec un employeur"
              >
                Préparer un entretien avec un employeur
              </DsfrLink>
            </ListItem>
          </List>
        </Accordion>

        <Box sx={{ mt: fr.spacing("2w") }}>
          <ReportJobLink
            itemId={recruteurLba?.company?.siret}
            type={LBA_ITEM_TYPE.RECRUTEURS_LBA}
            linkLabelNotReported="Signaler l’entreprise"
            linkLabelReported="Entreprise signalée"
            tooltip={
              <Box sx={{ p: 1 }}>
                <Typography fontSize="16px" lineHeight="24px" fontWeight="700" marginBottom="8px" color="#161616">
                  Cette entreprise vous semble peu recommandable ? Voici les raisons pour lesquelles vous pouvez nous signaler une entreprise :
                </Typography>
                <ul>
                  <li>Informations trompeuses ou fausses</li>
                  <li>Non-respect des lois du travail </li>
                  <li>Fraude ou arnaque</li>
                  <li>Comportement inapproprié ou abusif </li>
                </ul>
              </Box>
            }
          />
        </Box>
      </Box>
    </Box>
  )
}
export default RecruteurLbaDetail
