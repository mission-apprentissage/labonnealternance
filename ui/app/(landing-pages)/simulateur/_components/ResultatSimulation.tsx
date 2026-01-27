import { Box, Grid, List, ListItem, Typography } from "@mui/material"
import { fr } from "@codegouvfr/react-dsfr"
import Image from "next/image"
import { useSimulateur } from "@/app/(landing-pages)/simulateur/context/SimulateurContext"
import type { AnneeSimulation } from "@/services/simulateurAlternant"

const AnneeSimulationCard = ({ simulation, index }: { simulation: AnneeSimulation; index: number }) => {
  const annee: string = index === 0 ? "1ère année" : `${index + 1}e année`
  return (
    <Grid container border={`1px solid ${fr.colors.decisions.border.actionLow.blueFrance.default}`} borderRadius={2} spacing={0} mb={3}>
      <Grid
        size={{ xs: 12, md: 12 }}
        sx={{
          backgroundColor: fr.colors.decisions.background.open.blueFrance.default,
          borderBottom: `1px solid ${fr.colors.decisions.border.actionLow.blueFrance.default}`,
        }}
        p={"12px"}
        py={"4px"}
      >
        <Typography variant="body1" color={fr.colors.decisions.text.title.grey.default} fontWeight={700}>
          {annee}
        </Typography>
      </Grid>
      <Grid
        container
        size={{ xs: 12, md: 12 }}
        p={"12px"}
        py={"4px"}
        spacing={0}
        sx={{
          backgroundColor: "white",
          borderBottom: `1px solid ${fr.colors.decisions.border.actionLow.blueFrance.default}`,
        }}
      >
        <Grid size={{ xs: 12, md: 6 }} my={"auto"}>
          <Typography variant="body1" color={fr.colors.decisions.text.default.grey.default}>
            Salaire brut
          </Typography>
        </Grid>
        <Grid container size={{ xs: 12, md: 6 }}>
          <Grid size={{ xs: 12, md: 12 }}>
            <Typography variant="body1" fontWeight={700} color={fr.colors.decisions.text.default.grey.default}>
              {simulation.salaireAnnuelBrut.max} €
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 12 }}>
            <Typography variant="body1" color={fr.colors.decisions.text.default.grey.default}>
              Soit {simulation.salaireMensuelBrut.max} €/mois
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid container size={{ xs: 12, md: 12 }} p={"12px"} py={"4px"} spacing={0} sx={{ backgroundColor: "white" }}>
        <Grid size={{ xs: 12, md: 6 }} my={"auto"}>
          <Typography variant="body1" color={fr.colors.decisions.text.default.grey.default}>
            Salaire net après exonération
          </Typography>
        </Grid>
        <Grid container size={{ xs: 12, md: 6 }}>
          <Grid size={{ xs: 12, md: 12 }}>
            <Typography variant="body1" fontWeight={700} color={fr.colors.decisions.text.default.grey.default}>
              Entre {simulation.salaireAnnuelNet.min} et {simulation.salaireAnnuelNet.max} €
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 12 }}>
            <Typography variant="body1" color={fr.colors.decisions.text.default.grey.default}>
              Soit entre {simulation.salaireMensuelNet.min} et {simulation.salaireMensuelNet.max} €/mois
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

const ExplicationsSalaire = () => {
  return (
    <Box>
      <Typography variant="body2" color={fr.colors.decisions.text.title.grey.default} gutterBottom>
        Les données du simulateur sont présentées à des fins d'illustration. Elles ne prennent pas en compte :
      </Typography>
      <List sx={{ listStyleType: "disc", pl: 2, mb: 2 }} disablePadding dense>
        <ListItem sx={{ display: "list-item" }} disableGutters>
          <Typography variant="body2" color={fr.colors.decisions.text.title.grey.default}>
            La succession avec un précédent contrat en alternance
          </Typography>
        </ListItem>
        <ListItem sx={{ display: "list-item" }} disableGutters>
          <Typography variant="body2" color={fr.colors.decisions.text.title.grey.default}>
            Un éventuel changement de tranche d'âge en cours d'année
          </Typography>
        </ListItem>
        <ListItem sx={{ display: "list-item" }} disableGutters>
          <Typography variant="body2" color={fr.colors.decisions.text.title.grey.default}>
            Des primes versées par l'employeur par-delà le salaire réglementaire, tickets restaurants, remboursement domicile-travail, ... qui augmenteraient le salaire présenté
          </Typography>
        </ListItem>
      </List>
      <Typography variant="body2" color={fr.colors.decisions.text.title.grey.default} gutterBottom>
        L'apprenti est exonéré de la totalité des cotisations salariales d'origine légale et conventionnelle pour la part de sa rémunération à 50% dans le privé et 100% dans le
        public.
      </Typography>
      <Typography variant="body2" color={fr.colors.decisions.text.title.grey.default} gutterBottom>
        Dans cette simulation, le salaire de référence utilisé est le minimum réglementaire en vigueur au jour de la simulation. Certaines conventions collectives peuvent prévoir
        un revenu minimum plus élevé pour l’alternant.
      </Typography>
      <Typography variant="body2" color={fr.colors.decisions.text.title.grey.default} gutterBottom>
        L'employeur reste libre de proposer un salaire supérieur à celui-ci.
      </Typography>
    </Box>
  )
}

export const ResultatSimulation = () => {
  const { simulation } = useSimulateur()

  return (
    <Box py={2}>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
        <Box display={{ md: "flex", xs: "none" }}>
          <Image width={10} height={25} src="/images/triangle.svg" alt="" />
        </Box>
        <Typography variant="h2" color={fr.colors.decisions.text.title.blueFrance.default} gutterBottom p={{ xs: 2, md: 0 }}>
          Votre simulation :
        </Typography>
      </Box>
      <Box p={2}>
        {simulation ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 12 }}>
              {simulation.anneesSimulation.map((anneeSimulation, index) => (
                <AnneeSimulationCard key={index} simulation={anneeSimulation} index={index} />
              ))}
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <ExplicationsSalaire />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Image width={200} height={130} src="/images/calculatrice_simulateur.svg" alt="" aria-hidden="true" />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }} my={"auto"}>
              <Typography variant="body1" color={fr.colors.decisions.text.default.grey.default}>
                Complétez les informations demandées pour avoir l’estimation de votre rémunération. Ces critères entrent dans l’équation pour déterminer votre salaire en
                alternance.
              </Typography>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  )
}
