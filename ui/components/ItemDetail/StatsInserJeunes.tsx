import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

interface StatsInserJeunesProps {
  taux_en_formation: number | null
  taux_en_emploi_6_mois: number | null
  taux_autres_6_mois: number | null
  region: {
    nom: string
  }
  millesime: string
}

interface Props {
  stats: StatsInserJeunesProps
}

const StatsInserJeunes = ({ stats }: Props) => {
  return (
    stats.taux_en_formation && (
      <Box sx={{ pb: "0px", mt: fr.spacing("3w"), position: "relative", background: "white", padding: "16px 24px", maxWidth: "970px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h2" sx={{ mt: fr.spacing("4v") }}>
          Que deviennent les étudiants après cette formation ?
        </Typography>
        <Typography sx={{ mt: fr.spacing("6v"), fontWeight: 700 }}>Les chiffres pour la région {stats.region.nom}</Typography>
        <Box sx={{ mt: fr.spacing("6v"), display: "flex", flexDirection: { xs: "column", lg: "row" }, alignItems: "stretch" }}>
          <Box sx={{ mb: fr.spacing("6v"), mr: fr.spacing("6v"), textAlign: "center", backgroundColor: "#F6F6F6", width: "100%", maxWidth: "330px", p: fr.spacing("8v") }}>
            <Typography sx={{ mb: fr.spacing("6v"), fontSize: "40px", fontWeight: 700 }}>{stats.taux_en_formation}%</Typography>
            <Typography sx={{ mb: 0 }}>sont inscrits en formation</Typography>
            <Typography sx={{ mb: 0, color: "grey.425", mt: fr.spacing("6v"), fontSize: "12px" }}>(Formation supérieure, redoublants, changement de filière)</Typography>
          </Box>
          <Box sx={{ mb: fr.spacing("6v"), mr: fr.spacing("6v"), textAlign: "center", backgroundColor: "#F6F6F6", width: "100%", maxWidth: "330px", p: fr.spacing("8v") }}>
            {stats.taux_en_emploi_6_mois === undefined ? (
              <Typography sx={{ pt: fr.spacing("6v") }}>Nous sommes désolés mais le taux d'emploi au bout de 6 mois n'est pas disponible pour le moment.</Typography>
            ) : (
              <>
                <Typography sx={{ mb: fr.spacing("6v"), fontSize: "40px", fontWeight: 700 }}>{stats.taux_en_emploi_6_mois}%</Typography>
                <Typography sx={{ mb: 0 }}>sont en emploi au bout de 6 mois</Typography>
                <Typography sx={{ mb: 0, color: "grey.425", mt: fr.spacing("6v"), fontSize: "12px" }}>(tout type d'emploi salarié du privé)</Typography>
              </>
            )}
          </Box>
          <Box sx={{ mb: fr.spacing("6v"), textAlign: "center", backgroundColor: "#F6F6F6", width: "100%", maxWidth: "330px", p: fr.spacing("8v") }}>
            {stats.taux_autres_6_mois === undefined ? (
              <Typography sx={{ pt: fr.spacing("6v") }}>Nous sommes désolés mais le taux concernant les autres cas n'est pas disponible pour le moment.</Typography>
            ) : (
              <>
                <Typography sx={{ mb: fr.spacing("6v"), fontSize: "40px", fontWeight: 700 }}>{stats.taux_autres_6_mois}%</Typography>
                <Typography sx={{ mb: 0 }}>sont dans d'autres cas</Typography>
                <Typography sx={{ mb: 0, color: "grey.425", mt: fr.spacing("6v"), fontSize: "12px" }}>(Recherche d'emploi, service civique, à l'étranger, statut indépendant, etc.)</Typography>
              </>
            )}
          </Box>
        </Box>
        <Typography sx={{ mt: fr.spacing("6v"), color: "grey.425" }}>
          *Données issues du{" "}
          <DsfrLink href="https://documentation.exposition.inserjeunes.beta.gouv.fr/" aria-label="Site inserjeunes.beta.gouv.fr - nouvelle fenêtre">
            dispositif InserJeunes promotion {stats.millesime.replace("_", "/")}
          </DsfrLink>
        </Typography>
      </Box>
    )
  )
}

export default StatsInserJeunes
