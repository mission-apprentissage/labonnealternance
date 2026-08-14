"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Checkbox, CircularProgress, Divider, Link, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { Formik, useField, useFormikContext } from "formik"
import Image from "next/image"
import type { IJob } from "shared"
import type { IEtablissementCatalogueProcheWithDistanceJSON } from "shared/interface/etablissement.types"
import { getRelatedEtablissementsFromRome } from "@/utils/api"

// même contenu (textes et présentation) que la page /espace-pro/entreprise/offre/:id/mise-en-relation, pour le moment.
type IStep3Form = {
  etablissementCatalogueIds: string[]
}

function InfoDelegation() {
  return (
    <Box sx={{ ml: fr.spacing("10v"), display: { xs: "none", lg: "block" } }}>
      <Box sx={{ border: "1px solid #000091", p: fr.spacing("6v") }}>
        <Typography component="h2" sx={{ fontSize: "24px", lineHeight: "32px", fontWeight: "700", mb: fr.spacing("3v") }}>
          Partager votre offre aux CFA à proximité :
        </Typography>
        <Box>
          <Typography sx={{ mt: fr.spacing("6v") }}>
            <strong>Gagnez du temps : </strong>Accélérez votre recrutement, et trouvez des candidats qualifiés en partageant votre offre aux acteurs de l’apprentissage de votre
            région.
          </Typography>
          <Typography sx={{ mt: fr.spacing("6v") }}>
            <strong>Rejoindre le réseau des acteurs de l'apprentissage de votre territoire : </strong>
            Développez des relations de confiance avec les acteurs de l'apprentissage de votre territoire afin de promouvoir votre entreprise et vos métiers auprès des jeunes.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

const EtablissementsList = ({ etablissements, disabledIds }: { etablissements: IEtablissementCatalogueProcheWithDistanceJSON[]; disabledIds: string[] }) => {
  const [input, , helper] = useField<string[]>("etablissementCatalogueIds")

  const toggleEtablissement = (id: string) => {
    const newValue = input.value.includes(id) ? input.value.filter((x) => x !== id) : [...input.value, id]
    helper.setValue(newValue)
  }

  return (
    <Box sx={{ mt: fr.spacing("5v") }}>
      {etablissements.map((etablissement, index) => {
        const isDisabled = disabledIds.includes(etablissement._id)
        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: fr.spacing("4v"),
              borderStyle: "solid",
              borderWidth: "1px",
              borderColor: isDisabled ? "#E5E5E5" : "#000091",
              mb: fr.spacing("4v"),
              p: fr.spacing("4v"),
            }}
            key={etablissement._id}
            data-testid={`cfa-${index}`}
          >
            <Box sx={{ display: "flex", alignItems: "center", flexDirection: "row" }}>
              <Checkbox
                sx={{ "&.Mui-disabled .MuiSvgIcon-root": { display: "none" } }}
                disabled={isDisabled}
                checked={input.value.includes(etablissement._id)}
                onChange={() => toggleEtablissement(etablissement._id)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              {isDisabled && (
                <Box sx={{ display: "flex", alignItems: "flex-start", backgroundColor: "#F6F6F6", width: "fit-content", px: fr.spacing("2v"), py: fr.spacing("1v") }}>
                  <Image fetchPriority="high" src="/images/icons/chrono.svg" alt="" style={{ margin: "4px" }} unoptimized width={16} height={16} />
                  <Typography sx={{ fontSize: "12px", color: "#666666", mb: fr.spacing("2v") }}>CFA déjà contacté</Typography>
                </Box>
              )}
              <Typography sx={{ fontSize: "16px", lineHeight: "25px", fontWeight: "400", color: "#161616", textTransform: "capitalize", pr: fr.spacing("3v") }}>
                {etablissement.entreprise_raison_sociale}
              </Typography>
              <Typography sx={{ fontSize: "12px", lineHeight: "25px", color: "#666666", textTransform: "capitalize", pr: fr.spacing("3v") }}>
                {etablissement?.numero_voie} {etablissement?.type_voie} {etablissement?.nom_voie}, {etablissement?.code_postal} {etablissement?.localite}
              </Typography>
              <Link
                underline="hover"
                aria-label="Etablissement sur le site du catalogue des formations en apprentissage - nouvelle fenêtre"
                href={`https://catalogue-apprentissage.intercariforef.org/etablissement/${etablissement.siret}`}
                color="inherit"
                target="_blank"
                rel="noopener noreferrer"
              >
                En savoir plus
              </Link>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Divider orientation="vertical" />
              <Typography sx={{ fontSize: "12px", fontWeight: "700", color: "#666666", px: fr.spacing("4v") }}>à {etablissement.distance_en_km} km</Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

export const FormulaireEditionOffreStep3 = ({
  offre,
  romeCode,
  geoCoordinates,
  onSubmit,
  onCancel,
  isFtEligible = true,
  totalSteps = 4,
}: {
  offre?: IJob
  romeCode?: string
  geoCoordinates?: string | null
  onSubmit?: (values: any) => void
  onCancel: () => void
  isFtEligible?: boolean
  totalSteps?: number
}) => {
  const [latitude, longitude] = (geoCoordinates ?? "").split(",").map(parseFloat)
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)

  const { data: etablissements, isLoading } = useQuery({
    queryKey: ["etablissements-related-rome", romeCode, geoCoordinates],
    queryFn: () => getRelatedEtablissementsFromRome({ rome: romeCode as string, latitude, longitude, limit: 10 }) as Promise<IEtablissementCatalogueProcheWithDistanceJSON[]>,
    enabled: Boolean(romeCode) && hasCoordinates,
    gcTime: 0,
  })

  const disabledIds = (etablissements ?? [])
    .filter((etablissement) => offre?.delegations?.some((delegation) => etablissement.siret === delegation.siret_code))
    .map((etablissement) => etablissement._id)

  return (
    <Formik<IStep3Form>
      enableReinitialize={true}
      initialValues={{
        etablissementCatalogueIds: disabledIds,
      }}
      onSubmit={onSubmit}
    >
      {() => (
        <>
          <Typography
            component="h1"
            sx={{
              fontWeight: 700,
              color: "#000091",
              mb: fr.spacing("6v"),
              fontSize: { xs: "18px !important", md: "20px !important" },
              lineHeight: { xs: "24px !important", md: "28px !important" },
            }}
          >
            Étape 3/{totalSteps} : Contacter les écoles
          </Typography>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ minWidth: { xs: "100%", md: "50%" } }}>
              <Typography component="h2" sx={{ fontSize: "22px", lineHeight: "28px", fontWeight: 700, mb: fr.spacing("4v") }}>
                Ces centres de formation pourraient vous proposer des candidats (Facultatif)
              </Typography>
              <Typography>
                Les CFA suivants proposent des formations en lien avec votre offre et sont localisés dans un rayon de 100km près de votre entreprise.
                <br />
                Choisissez ceux que vous souhaitez solliciter : <strong>votre offre et vos informations de contact leur seront partagées par email.</strong>
              </Typography>
              {isLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("3v"), mt: fr.spacing("5v") }}>
                  <CircularProgress size={24} />
                  <Typography>Recherche des centres de formation à proximité…</Typography>
                </Box>
              ) : etablissements?.length ? (
                <EtablissementsList etablissements={etablissements} disabledIds={disabledIds} />
              ) : (
                <Typography sx={{ mt: fr.spacing("5v") }}>Aucun centre de formation n'a été trouvé à proximité de votre entreprise pour ce métier.</Typography>
              )}
            </Box>
            <InfoDelegation />
          </Box>
          <Buttons offre={offre} onCancel={onCancel} isFtEligible={isFtEligible} />
        </>
      )}
    </Formik>
  )
}

const Buttons = ({ offre, onCancel, isFtEligible }: { offre?: IJob; onCancel: () => void; isFtEligible: boolean }) => {
  const { isSubmitting, submitForm } = useFormikContext<IStep3Form>()

  return (
    <Box
      sx={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`, pt: fr.spacing("6v"), mt: fr.spacing("6v") }}
    >
      <Box sx={{ mr: fr.spacing("4v") }}>
        <Button aria-label="Retour vers l'étape 2 du formulaire de dépôt d'offre" className="fr-btn--secondary" onClick={() => onCancel()}>
          Retour
        </Button>
      </Box>
      {isFtEligible ? (
        <Button disabled={isSubmitting} aria-label="Continuer vers l'étape 4 du formulaire de dépôt d'offre" onClick={submitForm} data-testid="continuer-creer-offre">
          Continuer
        </Button>
      ) : (
        <Button disabled={isSubmitting} onClick={submitForm} data-testid="creer-offre">
          {offre?._id ? "Continuer et Mettre à jour l'offre" : "Continuer et Créer l'offre"}
        </Button>
      )}
    </Box>
  )
}
