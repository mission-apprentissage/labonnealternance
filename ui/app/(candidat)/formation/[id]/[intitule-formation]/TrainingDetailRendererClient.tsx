"use client"
import { Box, Flex, Image, Text } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/dist/client/components/navigation"
import { useRouter } from "next/navigation"
import { CSSProperties, Fragment, useEffect, useState } from "react"
import { ILbaItemFormation2Json, ILbaItemTraining2 } from "shared"
import { LBA_ITEM_TYPE, newItemTypeToOldItemType } from "shared/constants/lbaitem"

import { RechercheCarte } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap"
import { IUseRechercheResultsSuccess, useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { useBuildNavigation } from "@/app/hooks/useBuildNavigation"
import { useFormationPrdvTracker } from "@/app/hooks/useFormationPrdvTracker"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import AideApprentissage from "@/components/ItemDetail/AideApprentissage"
import GoingToContactQuestion, { getGoingtoId } from "@/components/ItemDetail/GoingToContactQuestion"
import { getNavigationButtons } from "@/components/ItemDetail/ItemDetailServices/getButtons"
import getJobPublishedTimeAndApplications from "@/components/ItemDetail/ItemDetailServices/getJobPublishedTimeAndApplications"
import GetItemTag from "@/components/ItemDetail/ItemDetailServices/getTags"
import ItemDetailCard from "@/components/ItemDetail/ItemDetailServices/ItemDetailCard"
import ItemGoogleSearchLink from "@/components/ItemDetail/ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "@/components/ItemDetail/ItemDetailServices/ItemLocalisation"
import JobItemCardHeader from "@/components/ItemDetail/ItemDetailServices/JobItemCardHeader"
import ShareLink from "@/components/ItemDetail/ShareLink"
import StatsInserJeunes from "@/components/ItemDetail/StatsInserJeunes"
import { DemandeDeContact } from "@/components/RDV/DemandeDeContact"
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

export default function TrainingDetailRendererClient({ training, params }: WithRecherchePageParams<{ training: ILbaItemFormation2Json }>) {
  const result = useRechercheResults(params)

  const trainingReference = {
    id: training.id,
    ideaType: newItemTypeToOldItemType(training.type),
  }

  const { appliedDate, setPrdvDone } = useFormationPrdvTracker(training.id)

  const detailPage = (
    <TrainingDetailPage selectedItem={training} appliedDate={appliedDate} resultList={result.status === "success" ? result.items : []} params={params} onRdvSuccess={setPrdvDone} />
  )

  if (params?.displayMap) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh", overflow: "hidden" }}>
        {detailPage}
        {/* TODO : remove extended search button from map view */}
        <RechercheCarte item={trainingReference} variant="detail" params={params} />
      </Box>
    )
  }

  return detailPage
}

function TrainingDetailPage({
  selectedItem,
  appliedDate,
  resultList,
  params,
  onRdvSuccess,
}: WithRecherchePageParams<{
  selectedItem: ILbaItemFormation2Json
  appliedDate: string | null
  resultList: IUseRechercheResultsSuccess["items"]
  onRdvSuccess: () => void
}>) {
  const kind: LBA_ITEM_TYPE = selectedItem?.type
  const actualTitle = selectedItem.training.title
  const isCfa = isCfaEntreprise(selectedItem?.company?.siret, selectedItem?.company?.headquarter?.siret)
  const isMandataire = selectedItem?.company?.mandataire
  const currentItem = resultList.find((item) => item.id === selectedItem.id)

  const router = useRouter()
  const { swipeHandlers, goNext, goPrev } = useBuildNavigation({ items: resultList, currentItem, params })
  const handleClose = () => router.push(PAGES.dynamic.recherche(params).getPath())

  const contextPRDV = {
    cle_ministere_educatif: selectedItem.id,
    etablissement_formateur_entreprise_raison_sociale: selectedItem.company.name,
  }

  const [isCollapsedHeader, setIsCollapsedHeader] = useState(false)
  const maxScroll = 100
  const handleScroll = () => {
    let currentScroll = document.querySelector("#itemDetailColumn").scrollTop
    currentScroll += isCollapsedHeader ? 100 : -100
    setIsCollapsedHeader(currentScroll > maxScroll)
  }

  const { elligibleForAppointment } = selectedItem.training

  const stickyHeaderProperties: CSSProperties = isCollapsedHeader
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
      <Box
        as="header"
        sx={{
          filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
          padding: "10px 20px 0px 10px",
          ...stickyHeaderProperties,
        }}
        background="white"
      >
        <Box width="100%" pl={["0", 4]} pb={isCollapsedHeader ? "0" : 2}>
          <Flex justifyContent="flex-end">
            {GetItemTag({ kind, isCfa, isMandataire })}
            {getNavigationButtons({ goPrev, goNext, handleClose })}
          </Flex>

          <Text as="p" textAlign="left" color="grey.600" mt={isCollapsedHeader ? 1 : 1} mb={isCollapsedHeader ? 1 : 1} fontWeight={700} fontSize="1rem">
            <Text as="span">{`${selectedItem?.company?.name || ""} (${selectedItem.company.place.city})`}</Text>
            <Text as="span" fontWeight={400}>
              &nbsp;propose cette formation
            </Text>
          </Text>

          {!isCollapsedHeader && getJobPublishedTimeAndApplications({ item: selectedItem })}
          {!isCollapsedHeader && <JobItemCardHeader selectedItem={selectedItem} kind={kind} isMandataire={isMandataire} />}

          <Typography variant={"h3"} sx={{ color: fr.colors.decisions.border.default.greenEmeraude.default }}>
            {actualTitle}
          </Typography>

          {!isCollapsedHeader && <ItemDetailCard selectedItem={selectedItem} />}
          {!isCollapsedHeader && <hr style={{ paddingBottom: "1px" }} />}

          <Flex flexDirection="row" alignItems="center" gap={2}>
            <Box flex={1}>
              {Boolean(appliedDate) && (
                <Box>
                  <Text
                    as="span"
                    className={fr.cx("ri-history-line", "fr-icon--sm", "fr-text--xs")}
                    px={2}
                    fontStyle="italic"
                    sx={{
                      backgroundColor: fr.colors.decisions.background.contrast.info.default,
                      color: fr.colors.decisions.background.actionHigh.info.default,
                    }}
                  >
                    Super, vous avez déjà pris contact le {appliedDate}.
                  </Text>
                </Box>
              )}
              {elligibleForAppointment && (
                <DemandeDeContact hideButton={Boolean(appliedDate)} isCollapsedHeader={isCollapsedHeader} context={contextPRDV} referrer="LBA" onRdvSuccess={onRdvSuccess} />
              )}
            </Box>
            <ShareLink item={selectedItem} />
          </Flex>
        </Box>
      </Box>

      <TrainingDetail training={selectedItem} />

      <AideApprentissage />

      {!priseDeRendezVous && <GoingToContactQuestion kind={kind} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />}
    </Box>
  )
}

function TrainingDetail({ training }: { training: ILbaItemFormation2Json }) {
  const isCfaDEntreprise = isCfaEntreprise(training?.company?.siret, training?.company?.headquarter?.siret)
  const params = useParams()
  const param = params

  const IJStats = useQuery({
    queryKey: ["getIJStats", training.training.cfd],
    queryFn: () => fetchInserJeuneStats(training),
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

const TrainingDescriptionDetails = ({ training }: { training: ILbaItemTraining2 }) => {
  return (
    <>
      {training.description && training.description.length > 30 && (
        <Flex alignItems="flex-start" mt={5}>
          <Image src="/images/icons/traning-clipboard-list.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Typography sx={{ fontWeight: "700" }}>Description de la formation</Typography>
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
            <Typography sx={{ fontWeight: "700" }}>Objectifs</Typography>
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
            <Typography sx={{ fontWeight: "700" }}>Sessions de formation</Typography>
            {training.sessions?.[0]?.isPermanentEntry
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
