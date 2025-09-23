import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import styled from "@emotion/styled"
import { Box, Typography } from "@mui/material"
import { IReferentielRomeForJobJson } from "shared"

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
      <Accordion style={{ marginBottom: fr.spacing("2w") }} defaultExpanded={true} id="metier" label="Descriptif du métier">
        {definition}
      </Accordion>
      {competences?.savoir_etre_professionnel && (
        <Accordion id="qualites" label="Qualités souhaitées pour ce métier">
          <CompetencesGroupDiv>
            {competences.savoir_etre_professionnel.map(({ libelle }) => (
              <li key={libelle}>{libelle}</li>
            ))}
          </CompetencesGroupDiv>
        </Accordion>
      )}
      {competences?.savoir_faire && (
        <Accordion style={{ marginBottom: fr.spacing("2w") }} id="competences" label="Compétences qui seront acquises durant l’alternance">
          {competences.savoir_faire.map(({ libelle, items = [] }) => (
            <CompetencesGroupDiv key={libelle}>
              <Typography className="competences-group-title">{libelle}</Typography>
              {items.map(({ libelle }) => (
                <li key={libelle}>{libelle}</li>
              ))}
            </CompetencesGroupDiv>
          ))}
        </Accordion>
      )}
      {competences?.savoirs && (
        <Accordion style={{ marginBottom: fr.spacing("2w") }} id="techniques" label="Domaines et techniques de travail">
          {competences.savoirs.map(({ libelle, items = [] }) => (
            <CompetencesGroupDiv key={libelle}>
              <Typography className="competences-group-title">{libelle}</Typography>
              {items.map(({ libelle }) => (
                <li key={libelle}>{libelle}</li>
              ))}
            </CompetencesGroupDiv>
          ))}
        </Accordion>
      )}

      <Accordion style={{ marginBottom: fr.spacing("2w") }} id="accessibilite" label="À qui ce métier est-il accessible ?">
        <Typography>{acces_metier}</Typography>
      </Accordion>

      <Typography sx={{ fontSize: "14px", color: "#3A3A3A", lineHeight: "24px" }}>La fiche métier se base sur la classification ROME de France Travail</Typography>
    </Box>
  )
}
