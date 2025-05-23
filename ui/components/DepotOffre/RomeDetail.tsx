import { Accordion, Badge, Box, Checkbox, Heading, Text } from "@chakra-ui/react"
import styled from "@emotion/styled"
import { useState } from "react"
import { IReferentielRomeForJobJson } from "shared"

import { classNames } from "@/utils/classNames"

import { BorderedBox } from "../espace_pro/common/components/BorderedBox"

import { CustomAccordion } from "./CustomAccordion"

const AccordionHeader = styled.p`
  font-weight: 700;

  .subtitle {
    color: #666666;
    font-style: italic;
    font-weight: 400;
    margin-left: 4px;
  }
  .count-badge {
    border-radius: 12px;
    background-color: #eeeeee;
    font-size: 12px;
    line-height: 20px;
    padding: 2px 8px;
    margin-left: 16px;
  }
`

const CompetenceSelectionDiv = styled.div`
  .competences-group-title {
    font-weight: 700;
    margin-bottom: 16px;
    margin-top: 2px;

    &.unselected {
      color: #929292;
    }
  }
  .competence-checkbox-line {
    margin-bottom: 16px;
    display: block;

    .competence-checkbox {
      font-weight: 400;

      &.unselected {
        color: #929292;
      }
    }
    .error-text {
      margin-left: 28px;
      color: #ce0500;
    }
  }
`

export const RomeDetail = ({
  title,
  romeReferentiel: { definition, competences, acces_metier },
  onChange,
  selectedCompetences,
}: {
  romeReferentiel: IReferentielRomeForJobJson
  selectedCompetences: Record<string, string[]>
  title: string
  onChange: (groupKey: string, competence: string, newlyChecked: boolean) => void
}) => {
  const isSelected = (accordionKey: string, competence: string) => (selectedCompetences[accordionKey] ?? []).includes(competence)

  return (
    <BorderedBox>
      <Heading mb={4}>{title}</Heading>
      <Text backgroundColor="#F5F5FE" padding={3} color="#000091" my={3}>
        Voici la description de l’offre qui sera consultable par les candidats.
        <br />
        <b>
          Décochez les items que vous souhaitez retirer de la description.
          <br />
          Veuillez conserver au minimum 3 items.
        </b>
      </Text>

      <Accordion defaultIndex={[0, 1]} allowMultiple>
        <CustomAccordion
          id="metier"
          header={
            <AccordionHeader>
              Descriptif du métier
              <Text as="span" className="subtitle" fontSize={["10px", "10px", "10px", "12px"]} lineHeight={["18px", "18px", "18px", "20px"]}>
                Non modifiable
              </Text>
            </AccordionHeader>
          }
        >
          <Text>{definition}</Text>
        </CustomAccordion>
        {competences?.savoir_etre_professionnel && (
          <RequiredCompetenceAccordion
            id="qualites"
            title="Qualités souhaitées pour ce métier"
            competences={[{ labels: competences.savoir_etre_professionnel.flatMap(({ libelle }) => (libelle ? [libelle] : [])) }]}
            onChange={(competence, newValue) => onChange("savoir_etre_professionnel", competence, newValue)}
            isSelected={(competence) => isSelected("savoir_etre_professionnel", competence)}
          />
        )}
        {competences?.savoir_faire && (
          <RequiredCompetenceAccordion
            id="competences"
            title="Compétences qui seront acquises durant l’alternance"
            competences={competences.savoir_faire.map(({ items = [], libelle }) => ({ category: libelle, labels: items.flatMap(({ libelle }) => (libelle ? [libelle] : [])) }))}
            onChange={(competence, newValue) => onChange("savoir_faire", competence, newValue)}
            isSelected={(competence) => isSelected("savoir_faire", competence)}
          />
        )}
        {competences?.savoirs && (
          <RequiredCompetenceAccordion
            id="techniques"
            title="Domaines et techniques de travail"
            competences={competences.savoirs.map(({ items = [], libelle }) => ({ category: libelle, labels: items.flatMap(({ libelle }) => (libelle ? [libelle] : [])) }))}
            onChange={(competence, newValue) => onChange("savoirs", competence, newValue)}
            isSelected={(competence) => isSelected("savoirs", competence)}
          />
        )}

        <CustomAccordion id="accessibilite" header={<AccordionHeader>À qui ce métier est-il accessible ?</AccordionHeader>}>
          <Text>{acces_metier}</Text>
        </CustomAccordion>
      </Accordion>
      <Text fontSize="14px" color="#3A3A3A" lineHeight="24px">
        La fiche métier se base sur la classification ROME de France Travail
      </Text>
    </BorderedBox>
  )
}

const CompetenceSelection = ({
  competences,
  groupTitle,
  onChange,
}: {
  groupTitle?: string
  competences: { label: string; selected: boolean; error?: string }[]
  onChange: (competence: string, newValue: boolean) => void
}) => {
  const areAllUnselected = competences.every((competence) => !competence.selected)
  return (
    <CompetenceSelectionDiv>
      {groupTitle && <Text className={classNames({ "competences-group-title": true, unselected: areAllUnselected })}>{groupTitle}</Text>}
      {competences.map((competence) => {
        return (
          <Box key={competence.label} className="competence-checkbox-line">
            <Checkbox
              className={classNames({ "competence-checkbox": true, unselected: !competence.selected })}
              isChecked={competence.selected}
              defaultChecked={competence.selected}
              onChange={() => onChange(competence.label, !competence.selected)}
            >
              <Text>{competence.label}</Text>
            </Checkbox>
            {competence.error && <Text className="error-text">{competence.error}</Text>}
          </Box>
        )
      })}
    </CompetenceSelectionDiv>
  )
}

const RequiredCompetenceAccordion = ({
  competences,
  onChange,
  isSelected,
  id,
  title,
}: {
  competences: { category?: string; labels: string[] }[]
  onChange: (competence: string, newValue: boolean) => void
  isSelected: (competence: string) => boolean
  id: string
  title: React.ReactNode
}) => {
  const [error, setError] = useState<{ competence: string; error: string } | null>(null)
  const competenceLabels = competences.flatMap(({ labels }) => labels)
  const totalCompetences = competenceLabels.length
  const totalSelected = competenceLabels.filter(isSelected).length
  const minRequired = Math.min(3, totalCompetences)
  return (
    <CustomAccordion
      id={id}
      header={
        <AccordionHeader>
          {title} <Badge className="count-badge">{totalSelected}</Badge>
        </AccordionHeader>
      }
    >
      {competences.map(({ category, labels }) => (
        <CompetenceSelection
          key={category ?? ""}
          groupTitle={category}
          competences={labels.map((label) => ({ label, selected: isSelected(label), error: error?.competence === label ? error.error : "" }))}
          onChange={
            totalSelected > minRequired
              ? onChange
              : (competence, newlySelected) => {
                  if (newlySelected) {
                    setError(null)
                    onChange(competence, newlySelected)
                    return true
                  } else {
                    setError({ competence, error: "Vous devez sélectionner 3 éléments minimum par rubrique. \nAjoutez un autre item pour pouvoir décocher celui-ci." })
                    return false
                  }
                }
          }
        />
      ))}
    </CustomAccordion>
  )
}
