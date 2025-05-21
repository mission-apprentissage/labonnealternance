import { Accordion, Box, Heading, Text } from "@chakra-ui/react"
import styled from "@emotion/styled"
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
    <Box border="1px solid #000091" p={5} mb={5}>
      <Heading fontSize="24px" mb="16px" lineHeight="32px">
        {appellation}
      </Heading>
      <Accordion defaultIndex={[0]} allowMultiple>
        <CustomAccordion id="metier" header={<AccordionHeader>Descriptif du métier</AccordionHeader>}>
          <Text>{definition}</Text>
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
                <Text className="competences-group-title">{libelle}</Text>
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
                <Text className="competences-group-title">{libelle}</Text>
                {items.map(({ libelle }) => (
                  <li key={libelle}>{libelle}</li>
                ))}
              </CompetencesGroupDiv>
            ))}
          </CustomAccordion>
        )}

        <CustomAccordion id="accessibilite" header={<AccordionHeader>À qui ce métier est-il accessible ?</AccordionHeader>}>
          <Text>{acces_metier}</Text>
        </CustomAccordion>
      </Accordion>
      <Text fontSize="14px" color="#3A3A3A" lineHeight="24px">
        La fiche métier se base sur la classification ROME de France Travail
      </Text>
    </Box>
  )
}
