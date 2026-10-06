"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Container, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import type { IJobWithRomeDetail } from "shared"
import { ENTREPRISE } from "shared/constants/recruteur"
import type { IEtablissementCatalogueProcheWithDistanceJSON } from "shared/interface/etablissement.types"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { createEtablissementDelegation, createEtablissementDelegationByToken, getFormulaire, getFormulaireByToken, getRelatedEtablissementsFromRome } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { InfoDelegation } from "./CfaDelegationContent"
import { CfaSelectionList } from "./CfaSelectionList"
import LoadingEmptySpace from "./LoadingEmptySpace"

function AucunCFAProche({ title }: { title?: string }) {
  return (
    <Box sx={{ display: "flex" }}>
      <Box sx={{ minWidth: { xs: "100%", md: "50%" } }}>
        <Box sx={{ p: fr.spacing("6v") }}>
          <Image fetchPriority="high" src="/images/aucunCfa.svg" alt="" unoptimized width={287} height={169} style={{ width: "100%", maxWidth: "287px" }} />
          <Typography sx={{ fontSize: "24px", mt: fr.spacing("5v") }}>Aucun CFA à proximité</Typography>
          <Typography sx={{ mt: fr.spacing("6v") }}>
            Votre offre :{" "}
            <Typography component="span" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          </Typography>
          <Typography sx={{ mt: fr.spacing("4v") }}>
            Nous n’avons pas identifié de centre de formation dans un rayon de 100km autour de votre entreprise qui forme sur le métier pour lequel vous recrutez.
          </Typography>
        </Box>
      </Box>
      <InfoDelegation />
    </Box>
  )
}

function DelegationsEnregistrees({
  first_name,
  last_name,
  email,
  phone,
  router,
}: {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  router: any
}) {
  return (
    <Box>
      <Box sx={{ border: "1px solid #000091", p: { xs: fr.spacing("2v"), md: fr.spacing("6v") }, mb: fr.spacing("5v") }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "center", md: "flex-start" } }}>
          <Image fetchPriority="high" src="/images/espace_pro/miseEnRelationEnvoyee.svg" alt="" unoptimized width={268} height={150} style={{ width: "100%", maxWidth: "268px" }} />
          <Box sx={{ mt: { xs: fr.spacing("4v"), md: 0 }, ml: { xs: 0, md: fr.spacing("5v") } }}>
            <Typography component="h1" sx={{ fontSize: "32px", lineHeight: "40px", fontWeight: "bold", mb: fr.spacing("4v") }}>
              Votre offre a été partagée aux CFA sélectionnés
            </Typography>
            <Box>
              <Typography>Les écoles que vous avez sélectionnées ont reçu par email votre offre et vos coordonnées suivantes :</Typography>
              <Typography sx={{ mt: fr.spacing("2v") }}>
                Prénom:{" "}
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {first_name}
                </Typography>
              </Typography>
              <Typography sx={{ mt: fr.spacing("2v") }}>
                Nom:{" "}
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {last_name}
                </Typography>
              </Typography>
              <Typography sx={{ mt: fr.spacing("2v") }}>
                Email:{" "}
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {email}
                </Typography>
              </Typography>
              <Typography sx={{ mt: fr.spacing("2v") }}>
                Numéro de téléphone:{" "}
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {phone}
                </Typography>
              </Typography>
              <Typography sx={{ mt: fr.spacing("4v") }}>Elles peuvent désormais vous recontacter pour vous proposer des candidats en adéquation avec vos besoins.</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Button
        onClick={() => {
          router.push(PAGES.dynamic.backHome({ userType: ENTREPRISE }).getPath())
        }}
      >
        Retourner aux offres
      </Button>
    </Box>
  )
}

export default function MiseEnRelation({ establishment_id, job_id, token }: { establishment_id: string; job_id: string; token?: string }) {
  const router = useRouter()

  const { data: formulaire, isLoading: isFormulaireLoading } = useQuery({
    queryKey: ["formulaire"],
    enabled: !!establishment_id,
    queryFn: () => (token ? getFormulaireByToken(establishment_id, token) : getFormulaire(establishment_id)),
  })

  //@ts-ignore
  const offre: IJobWithRomeDetail = formulaire && formulaire?.jobs?.length ? formulaire.jobs.find((job: IJobWithRomeDetail) => job._id?.toString() === job_id) : null

  const { data: etablissements, isLoading: isEtablissementLoading } = useQuery({
    queryKey: ["etablissements"],
    queryFn: () => {
      const [latitude, longitude] = formulaire.geo_coordinates.split(",").map(parseFloat)
      return getRelatedEtablissementsFromRome({
        rome: offre.rome_code[0],
        latitude,
        longitude,
        limit: 10,
      }) as Promise<IEtablissementCatalogueProcheWithDistanceJSON[]>
    },

    enabled: !!formulaire?._id && !!offre?._id,
    gcTime: 0,
  })

  const disabledIds = (etablissements ?? []).filter((etablissement) => offre.delegations?.some((delegation) => etablissement.siret === delegation.siret_code)).map(({ _id }) => _id)
  const isDisabled = (id: string) => disabledIds.includes(id)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const fieldsetRef = useRef<HTMLFieldSetElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [delegationsEnregistrees, setDelegationsEnregistrees] = useState(false)

  const toggleEtablissement = ({ _id: id }: IEtablissementCatalogueProcheWithDistanceJSON) => {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
    setSelectionError(null)
  }

  const submit = async () => {
    if (selectedIds.length === 0) {
      setSelectionError("Sélectionnez au moins un centre de formation")
      const firstCheckbox = fieldsetRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")
      firstCheckbox?.scrollIntoView({ behavior: "smooth", block: "center" })
      firstCheckbox?.focus({ preventScroll: true })
      return
    }
    setIsSubmitting(true)

    await (token
      ? createEtablissementDelegationByToken({
          jobId: offre._id.toString(),
          data: { etablissementCatalogueIds: selectedIds },
          token: token as string,
        })
      : createEtablissementDelegation({
          jobId: offre._id.toString(),
          data: { etablissementCatalogueIds: selectedIds },
        })
    )
      .then(() => {
        setDelegationsEnregistrees(true)
        window.scrollTo(0, 0)
      })
      .finally(() => setIsSubmitting(false))
  }

  if (isFormulaireLoading || isEtablissementLoading) return <LoadingEmptySpace label="Chargement en cours" />

  return (
    <DepotSimplifieStyling>
      <Container maxWidth="xl" sx={{ p: 0 }}>
        <Breadcrumb pages={[PAGES.static.backHomeEntreprise, PAGES.dynamic.backEntrepriseMiseEnRelation({ job_id })]} />
        {delegationsEnregistrees ? (
          <DelegationsEnregistrees router={router} first_name={formulaire.first_name} last_name={formulaire.last_name} email={formulaire.email} phone={formulaire.phone} />
        ) : (
          <>
            {etablissements?.length > 0 && (
              <Box sx={{ p: 0 }}>
                <Typography component="h1" sx={{ fontSize: "32px", lineHeight: "40px", fontWeight: "bold" }}>
                  Ces centres de formation pourraient vous proposer des candidats
                </Typography>
                <Box sx={{ display: "flex" }}>
                  <Box sx={{ minWidth: { xs: "100%", md: "50%" } }}>
                    <CfaSelectionList
                      ref={fieldsetRef}
                      etablissements={etablissements}
                      isChecked={(id) => isDisabled(id) || selectedIds.includes(id)}
                      isDisabled={isDisabled}
                      onToggle={toggleEtablissement}
                      hint="Sélectionnez au moins un centre de formation."
                      error={selectionError ?? undefined}
                      introSx={{ fontSize: "20px", lineHeight: "28px", mt: fr.spacing("4v") }}
                    />
                  </Box>
                  <InfoDelegation />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    boxShadow: "0px -16px 16px -16px rgba(0, 0, 0, 0.32)",
                    width: "100%",
                    my: fr.spacing("2v"),
                    position: "sticky",
                    bottom: 0,
                    left: 0,
                    backgroundColor: "white",
                    zIndex: 1000,
                    px: fr.spacing("10v"),
                    py: fr.spacing("4v"),
                  }}
                >
                  <Button disabled={isSubmitting} onClick={submit} data-testid="submit-delegation">
                    Envoyer ma demande
                  </Button>
                </Box>
              </Box>
            )}
            {etablissements?.length === 0 && <AucunCFAProche title={offre.rome_appellation_label} />}
          </>
        )}
      </Container>
    </DepotSimplifieStyling>
  )
}
