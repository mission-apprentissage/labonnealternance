import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import styled from "@emotion/styled"
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material"
import { useState } from "react"
import type { IReferentielRomeForJobJson } from "shared"

import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import Badge from "@/app/(espace-pro)/_components/Badge"
import { classNames } from "@/utils/classNames"

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
      <Typography
        component="h2"
        sx={{
          fontWeight: 700,
          mb: 4,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ backgroundColor: "#F5F5FE", padding: fr.spacing("3v"), color: "#000091", mt: fr.spacing("3v"), mb: fr.spacing("3w") }}>
        Voici la description de l’offre qui sera consultable par les candidats.
        <br />
        <b>
          Décochez les items que vous souhaitez retirer de la description.
          <br />
          Veuillez conserver au minimum 3 items.
        </b>
      </Box>
      <Accordion
        id="metier"
        defaultExpanded={true}
        label={
          <Box>
            Descriptif du métier{" "}
            <Typography
              component="span"
              className="subtitle"
              sx={{
                fontSize: ["10px", "10px", "10px", "12px"],
                lineHeight: ["18px", "18px", "18px", "20px"],
              }}
            >
              Non modifiable
            </Typography>
          </Box>
        }
      >
        <Typography>{definition}</Typography>
      </Accordion>
      {competences?.savoir_etre_professionnel && (
        <RequiredCompetenceAccordion
          id="qualites"
          title="Qualités souhaitées pour ce métier"
          competences={[{ labels: competences.savoir_etre_professionnel.flatMap(({ libelle }) => (libelle ? [libelle] : [])) }]}
          onChange={(competence, newValue) => onChange("savoir_etre_professionnel", competence, newValue)}
          isSelected={(competence) => isSelected("savoir_etre_professionnel", competence)}
          defaultExpanded={true}
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
      <Accordion style={{ marginBottom: fr.spacing("2w") }} id="accessibilite" label="À qui ce métier est-il accessible ?">
        <Typography>{acces_metier}</Typography>
      </Accordion>
      <Typography sx={{ fontSize: "14px", color: "#3A3A3A", lineHeight: "24px" }}>La fiche métier se base sur la classification ROME de France Travail</Typography>
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
      {groupTitle && <Typography className={classNames({ "competences-group-title": true, unselected: areAllUnselected })}>{groupTitle}</Typography>}
      {competences.map((competence) => {
        return (
          <Box key={competence.label} className="competence-checkbox-line">
            <FormControlLabel
              label={competence.label}
              control={<Checkbox defaultChecked={competence.selected} onChange={() => onChange(competence.label, !competence.selected)} />}
            />
            {competence.error && <Typography className="error-text">{competence.error}</Typography>}
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
  defaultExpanded = false,
}: {
  competences: { category?: string; labels: string[] }[]
  onChange: (competence: string, newValue: boolean) => void
  isSelected: (competence: string) => boolean
  id: string
  title: React.ReactNode
  defaultExpanded?: boolean
}) => {
  const [error, setError] = useState<{ competence: string; error: string } | null>(null)
  const competenceLabels = competences.flatMap(({ labels }) => labels)
  const totalCompetences = competenceLabels.length
  const totalSelected = competenceLabels.filter(isSelected).length
  const minRequired = Math.min(3, totalCompetences)
  return (
    <Accordion
      id={id}
      label={
        <>
          <Typography component="span" sx={{ mr: fr.spacing("1w") }}>
            {title}
          </Typography>
          <Badge className="count-badge">{totalSelected}</Badge>
        </>
      }
      defaultExpanded={defaultExpanded}
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
    </Accordion>
  )
}
