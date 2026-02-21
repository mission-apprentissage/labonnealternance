"use client"

import { Box, Grid, List, ListItem, Typography, Skeleton } from "@mui/material"
import { fr } from "@codegouvfr/react-dsfr"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useSimulateur } from "@/app/(landing-pages)/salaire-alternant/context/SimulateurContext"
import type { AnneeSimulation, InputSimulation, OutputSimulation } from "@/services/simulateurAlternant"

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
        p={fr.spacing("3v")}
        py={fr.spacing("1v")}
      >
        <Typography variant="body1" color={fr.colors.decisions.text.title.grey.default} fontWeight={700}>
          {annee}
        </Typography>
      </Grid>
      <Grid
        container
        size={{ xs: 12, md: 12 }}
        p={fr.spacing("3v")}
        py={fr.spacing("1v")}
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
              {simulation.salaireAnnuelBrut.max.toLocaleString("fr-FR")} €
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 12 }}>
            <Typography variant="body1" color={fr.colors.decisions.text.default.grey.default}>
              Soit {simulation.salaireMensuelBrut.max.toLocaleString("fr-FR")} €/mois
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid container size={{ xs: 12, md: 12 }} p={fr.spacing("3v")} py={fr.spacing("1v")} spacing={0} sx={{ backgroundColor: "white" }}>
        <Grid size={{ xs: 12, md: 6 }} my={"auto"}>
          <Typography variant="body1" color={fr.colors.decisions.text.default.grey.default}>
            Salaire net après exonération
          </Typography>
        </Grid>
        <Grid container size={{ xs: 12, md: 6 }}>
          <Grid size={{ xs: 12, md: 12 }}>
            <Typography variant="body1" fontWeight={700} color={fr.colors.decisions.text.default.grey.default}>
              Entre {simulation.salaireAnnuelNet.min.toLocaleString("fr-FR")} et {simulation.salaireAnnuelNet.max.toLocaleString("fr-FR")} €
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 12 }}>
            <Typography variant="body1" color={fr.colors.decisions.text.default.grey.default}>
              Soit entre {simulation.salaireMensuelNet.min.toLocaleString("fr-FR")} et {simulation.salaireMensuelNet.max.toLocaleString("fr-FR")} €/mois
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

const ExplicationsSalaire = ({ inputSimulation }: { inputSimulation: InputSimulation }) => {
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
      {inputSimulation.typeContrat === "apprentissage" && (
        <Typography variant="body2" color={fr.colors.decisions.text.title.grey.default} gutterBottom>
          L'apprenti est exonéré de la totalité des cotisations salariales d'origine légale et conventionnelle pour la part de sa rémunération à 50% dans le privé et 100% dans le
          public.
        </Typography>
      )}
      <Typography variant="body2" color={fr.colors.decisions.text.title.grey.default} gutterBottom>
        Dans cette simulation, le salaire de référence utilisé est le minimum réglementaire en vigueur au jour de la simulation.
      </Typography>
      <Typography variant="body2" color={fr.colors.decisions.text.title.grey.default} gutterBottom>
        Certaines conventions collectives peuvent prévoir un revenu minimum plus élevé pour l’alternant.
      </Typography>
      <Typography variant="body2" color={fr.colors.decisions.text.title.grey.default} gutterBottom>
        L'employeur reste libre de proposer un salaire supérieur à celui-ci.
      </Typography>
    </Box>
  )
}

const Loader = ({ simulation }: { simulation: OutputSimulation }) => {
  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 12 }}>
          {simulation.anneesSimulation.map((_anneeSimulation, index) => (
            <Skeleton key={index} variant="rectangular" height={146} sx={{ my: fr.spacing("2w") }} />
          ))}
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <Skeleton variant="rectangular" height={300} />
        </Grid>
      </Grid>
    </>
  )
}

export const ResultatSimulation = () => {
  const { simulation } = useSimulateur()
  const [isLoading, setIsLoading] = useState(false)

  // Affichage d'un loader lors d'une nouvelle simulation
  useEffect(() => {
    if (simulation) {
      window.scrollTo({ top: 0, behavior: "smooth" })
      setIsLoading(true)
      // Simulation d'un temps de chargement
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [simulation])

  return (
    <Box py={2}>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
        <Box display={{ md: "flex", xs: "none" }}>
          <Image width={10} height={25} src="/images/triangle.svg" alt="" aria-hidden="true" />
        </Box>
        <Typography variant="h2" color={fr.colors.decisions.text.title.blueFrance.default} gutterBottom p={{ xs: 2, md: 0 }}>
          Votre simulation :
        </Typography>
      </Box>
      <Box p={2}>
        {simulation ? (
          isLoading ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 12 }}>
                <Loader simulation={simulation} />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 12 }}>
                {simulation.anneesSimulation.map((anneeSimulation, index) => (
                  <AnneeSimulationCard key={index} simulation={anneeSimulation} index={index} />
                ))}
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <ExplicationsSalaire inputSimulation={simulation.inputSimulation} />
              </Grid>
            </Grid>
          )
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
