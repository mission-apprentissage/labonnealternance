import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import styled from "@emotion/styled"
import { Box, Typography } from "@mui/material"
import type { IReferentielRomeForJobJson } from "shared"

const CompetencesGroupDiv = styled.div`
  margin-bottom: 20px;

  .competences-group-title {
    font-size: 16px;
    line-height: 24px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  li {
    margin-left: 24px;
  }
`

// Les compétences forment une liste : un <li> hors <ul>/<ol> rend un document invalide (RGAA 8.2)
// et prive les lecteurs d'écran du nombre d'éléments. Marges neutralisées pour conserver le rendu
// d'origine, qui reposait sur le seul `margin-left` des <li>.
const CompetencesList = styled.ul`
  margin: 0;
  padding: 0;
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
    <Box>
      <Typography component="h4" sx={{ fontSize: "24px", lineHeight: "32px", fontWeight: 700, mb: fr.spacing("6v") }}>
        Description de l’offre
      </Typography>
      <Typography sx={{ fontSize: "12px", mb: fr.spacing("6v") }}>La fiche métier se base sur la classification ROME de France Travail</Typography>
      <Typography sx={{ fontSize: "20px", lineHeight: "32px", fontWeight: 700, mb: fr.spacing("4v") }}>{appellation}</Typography>
      <Accordion defaultExpanded={true} id="metier" label="Descriptif du métier">
        {definition}
      </Accordion>
      {competences?.savoir_etre_professionnel && (
        <Accordion defaultExpanded={true} id="qualites" label="Qualités souhaitées pour ce métier">
          <CompetencesGroupDiv>
            <CompetencesList>
              {competences.savoir_etre_professionnel.map(({ libelle }) => (
                <li key={libelle}>{libelle}</li>
              ))}
            </CompetencesList>
          </CompetencesGroupDiv>
        </Accordion>
      )}
      {competences?.savoir_faire && (
        <Accordion id="competences" label="Compétences qui seront acquises durant l’alternance">
          {competences.savoir_faire.map(({ libelle, items = [] }) => (
            <CompetencesGroupDiv key={libelle}>
              <Typography className="competences-group-title">{libelle}</Typography>
              <CompetencesList>
                {items.map(({ libelle }) => (
                  <li key={libelle}>{libelle}</li>
                ))}
              </CompetencesList>
            </CompetencesGroupDiv>
          ))}
        </Accordion>
      )}
      {competences?.savoirs && (
        <Accordion id="techniques" label="Domaines et techniques de travail">
          {competences.savoirs.map(({ libelle, items = [] }) => (
            <CompetencesGroupDiv key={libelle}>
              <Typography className="competences-group-title">{libelle}</Typography>
              <CompetencesList>
                {items.map(({ libelle }) => (
                  <li key={libelle}>{libelle}</li>
                ))}
              </CompetencesList>
            </CompetencesGroupDiv>
          ))}
        </Accordion>
      )}

      <Accordion id="accessibilite" label="À qui ce métier est-il accessible ?">
        <Typography>{acces_metier}</Typography>
      </Accordion>
    </Box>
  )
}
