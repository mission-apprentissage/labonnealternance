"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Checkbox, Divider, Link, Typography } from "@mui/material"
import { Formik, useField, useFormikContext } from "formik"
import Image from "next/image"
import type { IJob } from "shared"
import type { IEtablissementCatalogueProcheWithDistanceJSON } from "shared/interface/etablissement.types"
import { CfaSolicitationIntro, InfoDelegation } from "@/app/(espace-pro)/_components/CfaDelegationContent"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomo-utils"

// texte et présentation mutualisés avec la page /espace-pro/entreprise/offre/:id/mise-en-relation (cf. CfaDelegationContent).
type IStep3Form = {
  etablissementCatalogueIds: string[]
}

const EtablissementsList = ({ etablissements, disabledIds }: { etablissements: IEtablissementCatalogueProcheWithDistanceJSON[]; disabledIds: string[] }) => {
  const [input, , helper] = useField<string[]>("etablissementCatalogueIds")

  const toggleEtablissement = (id: string, siret: string) => {
    const checked = !input.value.includes(id)
    const newValue = checked ? [...input.value, id] : input.value.filter((x) => x !== id)
    helper.setValue(newValue)
    pushMatomoEvent({ event: checked ? MATOMO_EVENTS.CFA_SELECTED : MATOMO_EVENTS.CFA_DESELECTED, cfa_siret: siret })
  }

  return (
    <Box sx={{ mt: fr.spacing("5v") }}>
      {etablissements.map((etablissement, index) => {
        const isDisabled = disabledIds.includes(etablissement._id)
        const isChecked = input.value.includes(etablissement._id)
        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: fr.spacing("4v"),
              borderStyle: "solid",
              borderWidth: "1px",
              borderColor: isDisabled ? "#E5E5E5" : isChecked ? "#000091" : "#DDDDDD",
              mb: fr.spacing("4v"),
            }}
            key={etablissement._id}
            data-testid={`cfa-${index}`}
          >
            <Box sx={{ display: "flex", alignItems: "center", flexDirection: "row", pl: fr.spacing("1v") }}>
              <Checkbox
                sx={{ "&.Mui-disabled .MuiSvgIcon-root": { display: "none" } }}
                disabled={isDisabled}
                checked={isChecked}
                onChange={() => toggleEtablissement(etablissement._id, etablissement.siret)}
              />
            </Box>
            <Box sx={{ py: fr.spacing("4v"), flex: 1 }}>
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
                href={`https://catalogue-apprentissage.intercariforef.org/etablissement/${etablissement.siret}`}
                sx={{ color: "#000091" }}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => pushMatomoEvent({ event: MATOMO_EVENTS.CFA_DETAILS_CLICKED, cfa_siret: etablissement.siret })}
              >
                En savoir plus
                <span className="fr-sr-only">{" - Etablissement sur le site du catalogue des formations en apprentissage - nouvelle fenêtre"}</span>
              </Link>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Divider aria-hidden="true" orientation="vertical" />
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
  formValues,
  etablissements,
  onSubmit,
  onCancel,
  isFtEligible = true,
}: {
  offre?: IJob
  /** saisie déjà validée sur cette étape, à restaurer quand on y revient depuis l'étape 4 */
  formValues?: any
  // disponibilité déjà déterminée à l'étape 2 : cette étape n'est affichée que si la liste est non vide
  etablissements: IEtablissementCatalogueProcheWithDistanceJSON[]
  onSubmit?: (values: any) => void
  /** reçoit la saisie en cours : le retour ne doit pas la perdre plus que le passage à l'étape suivante */
  onCancel: (values: { etablissementCatalogueIds: string[] }) => void
  isFtEligible?: boolean
}) => {
  const disabledIds = etablissements
    .filter((etablissement) => offre?.delegations?.some((delegation) => etablissement.siret === delegation.siret_code))
    .map((etablissement) => etablissement._id)

  // les CFA déjà en délégation (disabledIds) ne doivent pas être re-notifiés : seules les nouvelles
  // sélections remontent au conteneur, à l'envoi comme au retour.
  const keepNewSelections = (ids: string[]): string[] => ids.filter((id) => !disabledIds.includes(id))

  // symétriquement, les cases cochées au retour sont les nouvelles sélections plus ces délégations.
  const previouslySelectedIds: string[] = formValues?.etablissementCatalogueIds ?? []

  return (
    <Formik<IStep3Form>
      enableReinitialize={true}
      initialValues={{
        etablissementCatalogueIds: [...new Set([...disabledIds, ...previouslySelectedIds])],
      }}
      onSubmit={(values) => {
        onSubmit?.({
          etablissementCatalogueIds: keepNewSelections(values.etablissementCatalogueIds),
          cfaCountProposed: etablissements.length,
          cfaCountSelected: values.etablissementCatalogueIds.length,
        })
      }}
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
            Étape 3 : Contacter les écoles
          </Typography>
          <Typography
            component="h2"
            sx={{ fontSize: { xs: "22px !important", md: "32px !important" }, lineHeight: { xs: "28px !important", md: "40px !important" }, fontWeight: 700, mb: fr.spacing("6v") }}
          >
            Ces centres de formation pourraient vous proposer des candidats (Facultatif)
          </Typography>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ minWidth: { xs: "100%", md: "50%" } }}>
              <CfaSolicitationIntro />
              <EtablissementsList etablissements={etablissements} disabledIds={disabledIds} />
            </Box>
            <InfoDelegation />
          </Box>
          <Buttons
            offre={offre}
            onCancel={({ etablissementCatalogueIds }) => onCancel({ etablissementCatalogueIds: keepNewSelections(etablissementCatalogueIds) })}
            isFtEligible={isFtEligible}
          />
        </>
      )}
    </Formik>
  )
}

const Buttons = ({ offre, onCancel, isFtEligible }: { offre?: IJob; onCancel: (values: IStep3Form) => void; isFtEligible: boolean }) => {
  const { isSubmitting, submitForm, values } = useFormikContext<IStep3Form>()

  return (
    <Box
      sx={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`, pt: fr.spacing("6v"), mt: fr.spacing("6v") }}
    >
      <Box sx={{ mr: fr.spacing("4v") }}>
        <Button aria-label="Retour vers l'étape 2 du formulaire de dépôt d'offre" className="fr-btn--secondary" onClick={() => onCancel(values)}>
          Retour
        </Button>
      </Box>
      {isFtEligible ? (
        <Button disabled={isSubmitting} aria-label="Continuer vers l'étape 4 du formulaire de dépôt d'offre" onClick={submitForm} data-testid="continuer-creer-offre">
          Continuer
        </Button>
      ) : (
        <Button disabled={isSubmitting} onClick={submitForm} data-testid="creer-offre">
          {offre?._id ? "Mettre à jour l'offre" : "Créer l'offre"}
        </Button>
      )}
    </Box>
  )
}
