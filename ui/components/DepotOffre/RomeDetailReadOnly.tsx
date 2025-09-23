import { Accordion } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import styled from "@emotion/styled"
import { Box, Typography } from "@mui/material"
import { IReferentielRomeForJobJson } from "shared"

import { CustomAccordion } from "./CustomAccordion"

const AccordionHeader = styled.div`
  font-size: 16px;
  font-weight: 700;

  .subtitle {
    color: #666666;
    font-style: italic;
    font-weight: 400;
    font-size: 12px;
    line-height: 20px;
    margin-left: 4px;
  }
`

const CompetencesGroupDiv = styled.div`
  margin-bottom: 20px;

  .competences-group-title {
    font-size: 16px;
    line-height: 24px;
    font-weight: 700;
    margin-bottom: 12px;
  }
`

export const RomeDetailReadOnly = ({
  appellation,
  romeReferentiel: { definition, acces_metier },
  competences,
}: {
  romeReferentiel: IReferentielRomeForJobJson
  competences: IReferentielRomeForJobJson["competences"]
  appellation: string
}) => {
  return (
    <Box sx={{ border: "1px solid #000091", p: fr.spacing("5v"), mb: fr.spacing("5v") }}>
      <Typography component="h2" sx={{ fontWeight: 700, mb: fr.spacing("2w") }}>
        {appellation}
      </Typography>
      <Accordion defaultIndex={[0]} allowMultiple>
        <CustomAccordion id="metier" header={<AccordionHeader>Descriptif du métier</AccordionHeader>}>
          <Typography>{definition}</Typography>
        </CustomAccordion>
        {competences?.savoir_etre_professionnel && (
          <CustomAccordion id="qualites" header={<AccordionHeader>Qualités souhaitées pour ce métier</AccordionHeader>}>
            <CompetencesGroupDiv>
              {competences.savoir_etre_professionnel.map(({ libelle }) => (
                <li key={libelle}>{libelle}</li>
              ))}
            </CompetencesGroupDiv>
          </CustomAccordion>
        )}
        {competences?.savoir_faire && (
          <CustomAccordion id="competences" header={<AccordionHeader>Compétences qui seront acquises durant l’alternance</AccordionHeader>}>
            {competences.savoir_faire.map(({ libelle, items = [] }) => (
              <CompetencesGroupDiv key={libelle}>
                <Typography className="competences-group-title">{libelle}</Typography>
                {items.map(({ libelle }) => (
                  <li key={libelle}>{libelle}</li>
                ))}
              </CompetencesGroupDiv>
            ))}
          </CustomAccordion>
        )}
        {competences?.savoirs && (
          <CustomAccordion id="techniques" header={<AccordionHeader>Domaines et techniques de travail</AccordionHeader>}>
            {competences.savoirs.map(({ libelle, items = [] }) => (
              <CompetencesGroupDiv key={libelle}>
                <Typography className="competences-group-title">{libelle}</Typography>
                {items.map(({ libelle }) => (
                  <li key={libelle}>{libelle}</li>
                ))}
              </CompetencesGroupDiv>
            ))}
          </CustomAccordion>
        )}

        <CustomAccordion id="accessibilite" header={<AccordionHeader>À qui ce métier est-il accessible ?</AccordionHeader>}>
          <Typography>{acces_metier}</Typography>
        </CustomAccordion>
      </Accordion>
      <Typography sx={{ fontSize: "14px", color: "#3A3A3A", lineHeight: "24px" }}>La fiche métier se base sur la classification ROME de France Travail</Typography>
    </Box>
  )
}
