"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Checkbox, Container, Divider, Link, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { IJobWithRomeDetail } from "shared"
import { ENTREPRISE } from "shared/constants/recruteur"
import { IEtablissementCatalogueProcheWithDistance, IEtablissementCatalogueProcheWithDistanceJSON } from "shared/interface/etablissement.types"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { createEtablissementDelegation, createEtablissementDelegationByToken, getFormulaire, getFormulaireByToken, getRelatedEtablissementsFromRome } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

function InfoDelegation() {
  return (
    <Box sx={{ ml: fr.spacing("5w"), display: { xs: "none", lg: "block" } }}>
      <Box sx={{ border: "1px solid #000091", p: fr.spacing("3w") }}>
        <Typography sx={{ fontSize: "24px", mb: fr.spacing("3v"), ml: fr.spacing("5v") }}>Pourquoi être accompagné par des CFA dans votre recherche d’alternant ?</Typography>
        <Box sx={{ ml: fr.spacing("5v") }}>
          <Typography sx={{ fontWeight: "700", mt: fr.spacing("3w") }}>Gagnez du temps.</Typography>
          <Typography sx={{ mt: fr.spacing("2w") }}>
            Accélérez votre recrutement, et trouvez des candidats qualifiés en partageant votre offre aux acteurs de l’apprentissage de votre région.
          </Typography>
          <Typography sx={{ fontWeight: "700", mt: fr.spacing("3w") }}>Rejoignez le réseau des acteurs de l'apprentissage de votre territoire.</Typography>
          <Typography sx={{ mt: fr.spacing("2w") }}>
            Développez des relations de confiance avec les acteurs de l'apprentissage de votre territoire afin de promouvoir votre entreprise et vos métiers auprès des jeunes.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

function AucunCFAProche({ title }: { title?: string }) {
  return (
    <Box sx={{ display: "flex" }}>
      <Box sx={{ minWidth: { xs: "100%", md: "50%" } }}>
        <Box sx={{ p: fr.spacing("3w") }}>
          <Image fetchPriority="high" src="/images/aucunCfa.svg" alt="" unoptimized width={287} height={169} style={{ width: "100%", maxWidth: "287px" }} />
          <Typography sx={{ fontSize: "24px", mt: fr.spacing("5v") }}>Aucun CFA à proximité</Typography>
          <Typography sx={{ mt: fr.spacing("3w") }}>
            Votre offre :{" "}
            <Typography component="span" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          </Typography>
          <Typography sx={{ mt: fr.spacing("2w") }}>
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
      <Box sx={{ border: "1px solid #000091", p: { xs: fr.spacing("1w"), md: fr.spacing("3w") }, mb: fr.spacing("5v") }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "center", md: "flex-start" } }}>
          <Image fetchPriority="high" src="/images/espace_pro/miseEnRelationEnvoyee.svg" alt="" unoptimized width={268} height={150} style={{ width: "100%", maxWidth: "268px" }} />
          <Box sx={{ mt: { xs: fr.spacing("2w"), md: 0 }, ml: { xs: 0, md: fr.spacing("5v") } }}>
            <Typography sx={{ fontSize: "24px", mb: fr.spacing("3v") }}>Votre offre a été partagée aux CFA sélectionnés</Typography>
            <Box>
              Les écoles que vous avez sélectionnées ont reçu par email votre offre et vos coordonnées suivantes :
              <Typography sx={{ mt: fr.spacing("1w") }}>
                Prénom:{" "}
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {first_name}
                </Typography>
              </Typography>
              <Typography sx={{ mt: fr.spacing("1w") }}>
                Nom:{" "}
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {last_name}
                </Typography>
              </Typography>
              <Typography sx={{ mt: fr.spacing("1w") }}>
                Email:{" "}
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {email}
                </Typography>
              </Typography>
              <Typography sx={{ mt: fr.spacing("1w") }}>
                Numéro de téléphone:{" "}
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {phone}
                </Typography>
              </Typography>
              <Typography sx={{ mt: fr.spacing("2w") }}>Elles peuvent désormais vous recontacter pour vous proposer des candidats en adéquation avec vos besoins.</Typography>
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

  const [checkedDisabledEtablissements, setCheckedDisabledEtablissements] = useState<IEtablissementCatalogueProcheWithDistance[]>([])

  const { data: formulaire, isLoading: isFormulaireLoading } = useQuery({
    queryKey: ["formulaire"],
    enabled: !!establishment_id,
    queryFn: () => (token ? getFormulaireByToken(establishment_id, token) : getFormulaire(establishment_id)),
  })

  //@ts-ignore
  const offre: IJobWithRomeDetail = formulaire && formulaire?.jobs?.length ? formulaire.jobs.find((job: IJobWithRomeDetail) => job._id?.toString() === job_id) : null

  const { data: etablissements, isLoading: isEtablissementLoading } = useQuery({
    queryKey: ["etablissements"],
    queryFn: async () => {
      const etablissements = await getRelatedEtablissementsFromRome({
        rome: offre.rome_code[0],
        latitude: formulaire.geopoint.coordinates[1],
        longitude: formulaire.geopoint.coordinates[0],
        limit: 10,
      })

      setCheckedDisabledEtablissements(
        //@ts-ignore
        etablissements.filter((etablissement: IEtablissementCatalogueProcheWithDistance) => offre.delegations?.some((delegation) => etablissement.siret === delegation.siret_code))
      )
      return etablissements
    },

    enabled: !!formulaire?._id && !!offre?._id,
    gcTime: 0,
  })

  const [checkedEtablissements, setCheckedEtablissements] = useState<IEtablissementCatalogueProcheWithDistance[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [delegationsEnregistrees, setDelegationsEnregistrees] = useState(false)

  /**
   * @description Handles all checkboxes.
   * @param {Object} etablissement
   * @return {void}
   */
  const changeEtablissement = (etablissement) => {
    const index = checkedEtablissements.findIndex((item) => item._id === etablissement._id)
    if (index === -1) {
      setCheckedEtablissements([...checkedEtablissements, etablissement])
    } else {
      setCheckedEtablissements(checkedEtablissements.filter((_, i) => i !== index))
    }
  }

  const submit = async () => {
    setIsSubmitting(true)
    const etablissementCatalogueIds = checkedEtablissements.map((etablissement) => etablissement._id)

    await (
      token
        ? createEtablissementDelegationByToken({
            jobId: offre._id.toString(),
            data: { etablissementCatalogueIds },
            token: token as string,
          })
        : createEtablissementDelegation({
            jobId: offre._id.toString(),
            data: { etablissementCatalogueIds },
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
              <Box sx={{ p: { xs: 0, md: fr.spacing("5v") } }}>
                <Box sx={{ display: "flex" }}>
                  <Box sx={{ minWidth: { xs: "100%", md: "50%" } }}>
                    <Typography component="h1" sx={{ fontSize: "32px", lineHeight: "40px", fontWeight: "bold" }}>
                      Ces centres de formation pourraient vous proposer des candidats
                    </Typography>
                    <Typography sx={{ fontSize: "20px", lineHeight: "28px", mt: fr.spacing("2w") }}>
                      Les centres de formation suivants proposent des formations en lien avec votre offre et sont localisés à proximité de votre entreprise.
                      <br />
                      Choisissez ceux à qui vous souhaitez partager votre offre.
                    </Typography>

                    <Box sx={{ mt: fr.spacing("5v") }}>
                      {etablissements.map((etablissement: IEtablissementCatalogueProcheWithDistanceJSON, index) => {
                        const isDisabled = checkedDisabledEtablissements.some((etab) => etab._id === etablissement._id)
                        return (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "row",
                              gap: fr.spacing("2w"),
                              borderStyle: "solid",
                              borderWidth: "1px",
                              borderColor: isDisabled ? "#E5E5E5" : "#000091",
                              mb: fr.spacing("4v"),
                              p: fr.spacing("2w"),
                            }}
                            key={etablissement._id}
                            data-testid={`cfa-${index}`}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", flexDirection: "row" }}>
                              <Checkbox disabled={isDisabled} defaultChecked={isDisabled} onChange={() => changeEtablissement(etablissement)} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              {isDisabled && (
                                <Box
                                  sx={{ display: "flex", alignItems: "flex-start", backgroundColor: "#F6F6F6", width: "fit-content", px: fr.spacing("1w"), py: fr.spacing("1v") }}
                                >
                                  <Image fetchPriority="high" src="/images/icons/chrono.svg" alt="" style={{ margin: "4px" }} unoptimized width={16} height={16} />
                                  <Typography sx={{ fontSize: "12px", color: "#666666", mb: fr.spacing("1w") }}>CFA déjà contacté</Typography>
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
                              <Typography sx={{ fontSize: "12px", fontWeight: "700", color: "#666666", px: fr.spacing("2w") }}>à {etablissement.distance_en_km} km</Typography>
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>
                  <InfoDelegation />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    boxShadow: "0px -16px 16px -16px rgba(0, 0, 0, 0.32)",
                    width: "100%",
                    my: 1,
                    position: "sticky",
                    bottom: 0,
                    left: 0,
                    backgroundColor: "white",
                    zIndex: 1000,
                    p: 5,
                  }}
                >
                  <Button disabled={checkedEtablissements.length === 0 || isSubmitting} onClick={submit} data-testid="submit-delegation">
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
