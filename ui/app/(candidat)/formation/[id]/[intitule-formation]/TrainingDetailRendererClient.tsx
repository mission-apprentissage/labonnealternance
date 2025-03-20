"use client"
import { Box, Flex, Image, Text } from "@chakra-ui/react"
import { useParams } from "next/dist/client/components/navigation"
import { useRouter } from "next/navigation"
import { Fragment, useEffect, useMemo, useState } from "react"
import { useQuery } from "react-query"
import { ILbaItemFormation2Json } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { RechercheCarte } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap"
import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { IUseRechercheResultsSuccess, useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { useBuildNavigation } from "@/app/hooks/useBuildNavigation"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import AideApprentissage from "@/components/ItemDetail/AideApprentissage"
import GoingToContactQuestion, { getGoingtoId } from "@/components/ItemDetail/GoingToContactQuestion"
import { getNavigationButtons } from "@/components/ItemDetail/ItemDetailServices/getButtons"
import getJobPublishedTimeAndApplications from "@/components/ItemDetail/ItemDetailServices/getJobPublishedTimeAndApplications"
import getTags from "@/components/ItemDetail/ItemDetailServices/getTags"
import ItemDetailCard from "@/components/ItemDetail/ItemDetailServices/ItemDetailCard"
import ItemGoogleSearchLink from "@/components/ItemDetail/ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "@/components/ItemDetail/ItemDetailServices/ItemLocalisation"
import JobItemCardHeader from "@/components/ItemDetail/ItemDetailServices/JobItemCardHeader"
import ShareLink from "@/components/ItemDetail/ShareLink"
import StatsInserJeunes from "@/components/ItemDetail/StatsInserJeunes"
import DemandeDeContact from "@/components/RDV/DemandeDeContact"
import { isCfaEntreprise } from "@/services/cfaEntreprise"
import fetchInserJeuneStats from "@/services/fetchInserJeuneStats"
import { SendPlausibleEvent } from "@/utils/plausible"
import { PAGES } from "@/utils/routes.utils"
import { formatDate } from "@/utils/strutils"

// Read https://css-tricks.com/snippets/css/prevent-long-urls-from-breaking-out-of-container/
const dontBreakOutCssParameters = {
  overflowWrap: "break-word",
  wordWrap: "break-word",
  wordBreak: "break-word",
  hyphens: "auto",
}

export default function TrainingDetailRendererClient({ training }: { training: ILbaItemFormation2Json }) {
  const params = useCandidatRechercheParams()
  const result = useRechercheResults(params)

  const appliedDate = useMemo(() => {
    if (globalThis.window == null) return null
    const storedValue = globalThis.window.localStorage.getItem(`application-${training.type}-${training.id}`)
    if (storedValue) {
      return new Date(parseInt(storedValue, 10)).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
    return null
  }, [training.type, training.id])

  if (result.status !== "success") {
    // TODO: handle error
    return null
  }

  if (params?.displayMap) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <TrainingDetailPage
          selectedItem={training}
          priseDeRendezVous={appliedDate ? false : training.training.elligibleForAppointment}
          appliedDate={appliedDate}
          resultList={result.items}
        />
        {/* TODO : remove extended search button from map view */}
        <RechercheCarte />
      </Box>
    )
  }

  return (
    <TrainingDetailPage
      selectedItem={training}
      priseDeRendezVous={appliedDate ? false : training.training.elligibleForAppointment}
      appliedDate={appliedDate}
      resultList={result.items}
    />
  )
}

function TrainingDetailPage({
  selectedItem,
  priseDeRendezVous,
  appliedDate,
  resultList,
}: {
  selectedItem: ILbaItemFormation2Json
  priseDeRendezVous: boolean
  appliedDate: string | null
  resultList: IUseRechercheResultsSuccess["items"]
}) {
  const kind: LBA_ITEM_TYPE = selectedItem?.type
  const actualTitle = selectedItem.training.title
  const isCfa = isCfaEntreprise(selectedItem?.company?.siret, selectedItem?.company?.headquarter?.siret)
  const isMandataire = selectedItem?.company?.mandataire
  const currentItem = resultList.find((item) => item.id === selectedItem.id)

  const searchParams = useCandidatRechercheParams()
  const router = useRouter()
  const { swipeHandlers, goNext, goPrev } = useBuildNavigation({ items: resultList, currentItem })
  const handleClose = () => router.push(PAGES.dynamic.recherche(searchParams).getPath())

  console.log(selectedItem)

  const contextPRDV = {
    cle_ministere_educatif: selectedItem.id,
    etablissement_formateur_entreprise_raison_sociale: selectedItem.company.name,
  }

  // const { activeFilters } = useContext(DisplayContext)

  // useEffect(() => {
  //   try {
  //     filterLayers(activeFilters)
  //   } catch (err) {
  //     //notice: gère des erreurs qui se présentent à l'initialisation de la page quand mapbox n'est pas prêt.
  //   }
  //   /* eslint react-hooks/exhaustive-deps: 0 */
  //   /* @ts-expect-error: à cracker */
  // }, [selectedItem?.id, selectedItem?.company?.siret, selectedItem?.job?.id])

  const [isCollapsedHeader, setIsCollapsedHeader] = useState(false)
  const maxScroll = 100
  const handleScroll = () => {
    let currentScroll = document.querySelector("#itemDetailColumn").scrollTop
    currentScroll += isCollapsedHeader ? 100 : -100
    setIsCollapsedHeader(currentScroll > maxScroll)
  }

  const stickyHeaderProperties = isCollapsedHeader
    ? {
        position: "sticky",
        zIndex: "1",
        top: "0",
        left: "0",
        display: "flex",
        width: "100%",
      }
    : {}

  return (
    <Box
      as="section"
      onScroll={handleScroll}
      id="itemDetailColumn"
      display={selectedItem ? "block" : "none"}
      sx={{
        overflowY: "auto",
        position: "relative",
        height: "100vh",
        backgroundColor: "#f8f8f8",
      }}
      {...swipeHandlers}
    >
      {/* @ts-expect-error: TODO */}
      <Box
        as="header"
        sx={{
          filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
          padding: "10px 20px 0px 10px",
        }}
        background="white"
        {...stickyHeaderProperties}
      >
        <Box width="100%" pl={["0", 4]} pb={isCollapsedHeader ? "0" : 2}>
          <Flex justifyContent="flex-end">
            {getTags({ kind, isCfa, isMandataire })}
            {getNavigationButtons({ goPrev, goNext, handleClose })}
          </Flex>

          <Text as="p" textAlign="left" color="grey.600" mt={isCollapsedHeader ? 1 : 4} mb={isCollapsedHeader ? 1 : 3} fontWeight={700} fontSize="1rem">
            <Text as="span">{`${selectedItem?.company?.name || ""} (${selectedItem.company.place.city})`}</Text>
            <Text as="span" fontWeight={400}>
              &nbsp;propose cette formation
            </Text>
          </Text>

          {!isCollapsedHeader && getJobPublishedTimeAndApplications({ item: selectedItem })}
          {!isCollapsedHeader && <JobItemCardHeader selectedItem={selectedItem} kind={kind} isMandataire={isMandataire} />}

          <Text
            as="h1"
            fontSize={isCollapsedHeader ? "20px" : "28px"}
            color={"greensoft.500"}
            sx={{
              fontWeight: 700,
              marginBottom: isCollapsedHeader ? "4px" : "11px",
              paddingBottom: "0",
              textAlign: "left",
              wordBreak: "break-word",
            }}
          >
            {actualTitle}
          </Text>

          {!isCollapsedHeader && <ItemDetailCard selectedItem={selectedItem} />}

          {!isCollapsedHeader && <hr />}

          <Flex flexDirection={{ base: "column", sm: "row" }} alignItems="center">
            <Box flex={1}>
              {appliedDate ? (
                <Text color="grey.600" as="span" px={2} py={1} backgroundColor="#FEF7DA">
                  <Text as="span">👍 </Text>
                  <Text as="span" fontStyle="italic">
                    Super, vous avez déjà pris contact le {appliedDate}.
                  </Text>
                </Text>
              ) : (
                priseDeRendezVous && <DemandeDeContact isCollapsedHeader={isCollapsedHeader} context={contextPRDV} referrer="LBA" showInModal />
              )}
            </Box>
            <ShareLink item={selectedItem} />
          </Flex>
        </Box>
      </Box>

      <TrainingDetail training={selectedItem} />

      <AideApprentissage />

      {!priseDeRendezVous && <GoingToContactQuestion kind={kind} uniqId={getGoingtoId(kind, selectedItem)} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />}
    </Box>
  )
}

function TrainingDetail({ training }: { training: ILbaItemFormation2Json }) {
  const isCfaDEntreprise = isCfaEntreprise(training?.company?.siret, training?.company?.headquarter?.siret)
  const params = useParams()
  const param = params

  const IJStats = useQuery(["getIJStats", training.training.cfd], () => fetchInserJeuneStats(training), {
    enabled: Boolean(training.training.cfd),
  })

  // TODO convert to client component and add in the tree
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche formation", {
      info_fiche: `${training.id}${param["intitule-formation"] ? ` - ${param["intitule-formation"]}` : ""}`,
    })
  }, [training.id, param])

  return (
    <>
      <Box
        pb="0px"
        mt={6}
        position="relative"
        background="white"
        padding={["1px 12px 36px 12px", "1px 24px 36px 24px", "1px 12px 24px 12px"]}
        maxWidth="970px"
        mx={["0", "30px", "30px", "auto"]}
      >
        <TrainingDescriptionDetails training={training.training} />
        <Box background="#f6f6f6" borderRadius="8px" mt={8} pl={8} py="10px" pr="10px">
          {training.training.onisepUrl && (
            <Box>
              <Text as="span">Descriptif du {training.training.title} sur&nbsp;</Text>
              <Text as="span">
                <DsfrLink href={training.training.onisepUrl} aria-label="Formation sur le site de l'onisep - nouvelle fenêtre">
                  le site Onisep&nbsp;
                </DsfrLink>
              </Text>
            </Box>
          )}
          <Box my={2}>
            Vous vous posez des questions sur votre orientation ou votre recherche d&apos;emploi ?&nbsp;
            <DsfrLink
              href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
              aria-label="Lien vers des conseils pour préparer son premier contact avec un CFA - nouvelle fenêtre"
            >
              Préparez votre premier contact avec un CFA&nbsp;
            </DsfrLink>
          </Box>
        </Box>
      </Box>

      {IJStats.isFetched && <StatsInserJeunes stats={IJStats.data} />}

      <Box pb="0px" mt={6} position="relative" background="white" padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
        <Text as="h2" variant="itemDetailH2" my={2}>
          Quelques informations l'établissement
        </Text>

        <ItemLocalisation item={training} />

        {training?.contact?.phone && (
          <Text mt={1}>
            <Text as="span" fontWeight={700}>
              Téléphone :{" "}
            </Text>
            <Text as="span">
              <DsfrLink href={`tel:${training.contact.phone}`} aria-label="Appeler la société au téléphone">
                {training.contact.phone}
              </DsfrLink>
            </Text>
          </Text>
        )}

        <ItemGoogleSearchLink item={training} />

        {training.contact.url && (
          <Flex alignItems="center" mt={2} direction="row">
            <Box width="30px" minWidth="30px" mr={2}>
              <Image mt="2px" src="/images/icons/small_info.svg" alt="" />
            </Box>
            <Text as="span">
              En savoir plus sur
              <DsfrLink href={training.contact.url} aria-label="Site de l'entreprise - nouvelle fenêtre">
                {training.contact.url}
              </DsfrLink>
            </Text>
          </Flex>
        )}
      </Box>

      {isCfaDEntreprise && (
        <Box background="white" borderRadius="8px" mt={6} padding="16px 24px" maxWidth="970px" mx={["0", "30px", "30px", "auto"]}>
          <Flex alignItems="center" pt={1} pb={2}>
            <Image src="/images/info.svg" alt="" width="24px" height="24px" />
            <Text as="span" ml={2} fontWeight={700}>
              Cet établissement est un CFA d&apos;entreprise
            </Text>
          </Flex>
          <Text>
            La particularité ? Il s&apos;agit d&apos;une formule complète <strong>Emploi + Formation</strong> ! Cette formation vous intéresse ? La marche à suivre diffère selon le
            CFA d&apos;entreprise concerné :
          </Text>

          <Box mt={3}>
            &bull;{" "}
            <Text as="span" ml={4}>
              Commencez par vous inscrire à la formation pour accéder ensuite au contrat,
            </Text>
          </Box>
          <Box mt={2}>
            &bull;{" "}
            <Text as="span" ml={4}>
              Ou commencez par postuler à une offre d&apos;emploi pour être ensuite inscrit en formation.
            </Text>
          </Box>

          <Text>Prenez contact avec cet établissement ou consultez son site web pour en savoir + !</Text>

          <Box my={2}>
            Vous vous posez des questions sur votre orientation ou votre recherche d&apos;emploi ?&nbsp;
            <DsfrLink
              href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
              aria-label="Lien vers des conseils pour préparer son premier contact avec un CFA - nouvelle fenêtre"
            >
              Préparez votre premier contact avec un CFA&nbsp;
            </DsfrLink>
          </Box>
        </Box>
      )}
    </>
  )
}

const TrainingDescriptionDetails = ({ training }) => {
  return (
    <>
      {training.description && training.description.length > 30 && (
        <Flex alignItems="flex-start" mt={5}>
          <Image src="/images/icons/traning-clipboard-list.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Text as="h3" mt="0" mb={4} fontWeight={700} color="grey.700">
              Description de la formation
            </Text>
            <Text as="span" sx={dontBreakOutCssParameters}>
              {training.description}
            </Text>
          </Box>
        </Flex>
      )}
      {training.objectif && training.objectif.length > 20 && (
        <Flex alignItems="flex-start" mt={5}>
          <Image mt={1} src="/images/icons/training-target.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Text as="h3" mt="0" mb={4} fontWeight={700} color="grey.700">
              Objectifs
            </Text>
            <Text as="span" sx={dontBreakOutCssParameters}>
              {training.objectif}
            </Text>
          </Box>
        </Flex>
      )}
      {training.sessions.length ? (
        <Flex alignItems="flex-start" mt={5}>
          <Image src="/images/icons/training-academic-cap.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Text as="h3" mt="0" mb={4} fontWeight={700} color="grey.700">
              Sessions de formation
            </Text>
            {training["sessions"][0].isPermanentEntry
              ? "Il est possible de s’inscrire à cette formation tout au long de l’année."
              : training["sessions"].map((session, i) => (
                  <Fragment key={i}>
                    du {formatDate(session.startDate)} au {formatDate(session.endDate)}
                    <br />
                  </Fragment>
                ))}
          </Box>
        </Flex>
      ) : null}
    </>
  )
}
