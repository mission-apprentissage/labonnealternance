import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import styled from "@emotion/styled"
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material"
import { useId, useState } from "react"
import type { IReferentielRomeForJobJson } from "shared"
import Badge from "@/app/(espace-pro)/_components/Badge"
import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { classNames } from "@/utils/class-names"

export type RomeCompetenceKey = "savoir_etre_professionnel" | "savoir_faire" | "savoirs"

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
  selectedCompetences: Record<RomeCompetenceKey, Set<string>>
  title: string
  onChange: (groupKey: RomeCompetenceKey, competence: string, newlyChecked: boolean) => void
}) => {
  const isSelected = (accordionKey: RomeCompetenceKey) => {
    const competences = selectedCompetences[accordionKey]
    return (competence: string) => competences.has(competence)
  }

  return (
    <BorderedBox>
      <Typography
        component="h2"
        sx={{
          fontWeight: 700,
          mb: fr.spacing("8v"),
        }}
      >
        {title}
      </Typography>
      <Box component="p" sx={{ backgroundColor: "#F5F5FE", padding: fr.spacing("3v"), color: "#000091", mt: fr.spacing("3v"), mb: fr.spacing("6v") }}>
        Voici la description de l’offre qui sera consultable par les candidats.
        <br />
        <Box component="span" sx={{ fontWeight: 700 }}>
          Décochez les items que vous souhaitez retirer de la description.
          <br />
          Veuillez conserver au minimum 3 items.
        </Box>
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
          competences={[{ items: competences.savoir_etre_professionnel }]}
          onChange={(competence, newValue) => onChange("savoir_etre_professionnel", competence, newValue)}
          isSelected={isSelected("savoir_etre_professionnel")}
        />
      )}
      {competences?.savoir_faire && (
        <RequiredCompetenceAccordion
          id="competences"
          title="Compétences qui seront acquises durant l’alternance"
          competences={competences.savoir_faire}
          onChange={(competence, newValue) => onChange("savoir_faire", competence, newValue)}
          isSelected={isSelected("savoir_faire")}
        />
      )}
      {competences?.savoirs && (
        <RequiredCompetenceAccordion
          id="techniques"
          title="Domaines et techniques de travail"
          competences={competences.savoirs}
          onChange={(competence, newValue) => onChange("savoirs", competence, newValue)}
          isSelected={isSelected("savoirs")}
        />
      )}
      <Accordion style={{ marginBottom: fr.spacing("4v") }} id="accessibilite" label="À qui ce métier est-il accessible ?">
        <Typography>{acces_metier}</Typography>
      </Accordion>
      <Typography sx={{ fontSize: "14px", color: "#3A3A3A", lineHeight: "24px" }}>La fiche métier se base sur la classification ROME de France Travail</Typography>
    </BorderedBox>
  )
}

/**
 * Une catégorie de compétences en fieldset (RGAA 11.5). Une rubrique sans catégorie prend pour légende,
 * masquée, le titre de son accordéon. Les cases sont contrôlées : un décochage refusé (minimum 3) doit
 * laisser la case cochée.
 */
const CompetenceSelection = ({
  competences,
  legend,
  isLegendVisible,
  name,
  onChange,
}: {
  legend: React.ReactNode
  isLegendVisible: boolean
  name: string
  competences: { label: string; selected: boolean; error?: string }[]
  onChange: (competence: string, newValue: boolean) => void
}) => {
  const baseId = useId()
  const areAllUnselected = competences.every((competence) => !competence.selected)
  return (
    <CompetenceSelectionDiv>
      <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Typography
          component="legend"
          className={isLegendVisible ? classNames({ "competences-group-title": true, unselected: areAllUnselected }) : fr.cx("fr-sr-only")}
          sx={{ p: 0 }}
        >
          {legend}
        </Typography>
        {competences.map((competence, index) => {
          const id = `${baseId}-${index}`
          const errorId = `${id}-error`
          return (
            <Box key={competence.label} className="competence-checkbox-line">
              <FormControlLabel
                htmlFor={id}
                label={competence.label}
                control={
                  <Checkbox
                    id={id}
                    name={name}
                    checked={competence.selected}
                    onChange={() => onChange(competence.label, !competence.selected)}
                    slotProps={{ input: { "aria-describedby": competence.error ? errorId : undefined, "aria-invalid": Boolean(competence.error) } }}
                  />
                }
              />
              <Typography id={errorId} className="error-text" aria-live="polite">
                {competence.error}
              </Typography>
            </Box>
          )
        })}
      </Box>
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
  competences: { libelle?: string; items?: { libelle?: string }[] }[]
  onChange: (competence: string, newValue: boolean) => void
  isSelected: (competence: string) => boolean
  id: string
  title: React.ReactNode
  defaultExpanded?: boolean
}) => {
  const [error, setError] = useState<{ competence: string; error: string } | null>(null)
  const competenceLabels = competences.flatMap(({ items = [] }) => items.flatMap(({ libelle }) => (libelle ? [libelle] : [])))
  const totalCompetences = competenceLabels.length
  const totalSelected = competenceLabels.filter(isSelected).length
  const minRequired = Math.min(3, totalCompetences)
  return (
    <Accordion
      id={id}
      label={
        <>
          <Typography component="span" sx={{ mr: fr.spacing("2v") }}>
            {title}
          </Typography>
          <Badge className="count-badge">{totalSelected}</Badge>
        </>
      }
      defaultExpanded={defaultExpanded}
    >
      {competences.map(({ libelle: category, items = [] }) => (
        <CompetenceSelection
          key={category ?? ""}
          legend={category ?? title}
          isLegendVisible={Boolean(category)}
          name={id}
          competences={items.map(({ libelle: label }) => ({ label, selected: isSelected(label), error: error?.competence === label ? error.error : "" }))}
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
