"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/dist/client/components/navigation"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { CSSProperties } from "react"
import { Fragment, useEffect, useState } from "react"
import type { ILbaItemFormation2Json, ILbaItemTraining2 } from "shared"
import type { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { LBA_ITEM_TYPE_OLD, newItemTypeToOldItemType } from "shared/constants/lbaitem"

import { RechercheCarte } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheResultats/RechercheMap"
import type { IUseRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { Footer } from "@/app/_components/Footer"
import { useBuildNavigation } from "@/app/hooks/useBuildNavigation"
import { useFormationPrdvTracker } from "@/app/hooks/useFormationPrdvTracker"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import AideApprentissage from "@/components/ItemDetail/AideApprentissage"
import GoingToContactQuestion, { getGoingtoId } from "@/components/ItemDetail/GoingToContactQuestion"
import ItemDetailCard from "@/components/ItemDetail/ItemDetailServices/ItemDetailCard"
import ItemGoogleSearchLink from "@/components/ItemDetail/ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "@/components/ItemDetail/ItemDetailServices/ItemLocalisation"
import JobItemCardHeader from "@/components/ItemDetail/ItemDetailServices/JobItemCardHeader"
import { LbaItemTags } from "@/components/ItemDetail/ItemDetailServices/LbaItemTags"
import { NavigationButtons } from "@/components/ItemDetail/ItemDetailServices/NavigationButtons"
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

export default function TrainingDetailRendererClient({ training, rechercheParams }: { rechercheParams: IRecherchePageParams; training: ILbaItemFormation2Json }) {
  const result = useRechercheResults(rechercheParams)

  const trainingReference = {
    id: training.id,
    ideaType: newItemTypeToOldItemType(training.type),
  }

  const { appliedDate, setPrdvDone } = useFormationPrdvTracker(training.id)

  const detailPage = (
    <TrainingDetailPage selectedItem={training} appliedDate={appliedDate} resultList={result.displayedItems} rechercheParams={rechercheParams} onRdvSuccess={setPrdvDone} />
  )

  if (rechercheParams?.displayMap) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh", overflow: "hidden" }}>
        {detailPage}
        {/* TODO : remove extended search button from map view */}
        <RechercheCarte item={trainingReference} variant="detail" rechercheParams={rechercheParams} />
      </Box>
    )
  }

  return detailPage
}

function TrainingDetailPage({
  selectedItem,
  appliedDate,
  resultList,
  rechercheParams,
  onRdvSuccess,
}: {
  rechercheParams: IRecherchePageParams
  selectedItem: ILbaItemFormation2Json
  appliedDate: string | null
  resultList: IUseRechercheResults["displayedItems"]
  onRdvSuccess: () => void
}) {
  const kind: LBA_ITEM_TYPE = selectedItem?.type
  const actualTitle = selectedItem.training.title
  const isMandataire = selectedItem?.company?.mandataire

  const router = useRouter()
  const { swipeHandlers, goNext, goPrev } = useBuildNavigation({ items: resultList, currentItemId: selectedItem.id, rechercheParams: rechercheParams })
  const handleClose = () => router.push(PAGES.dynamic.recherche(rechercheParams).getPath())

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
      onScroll={handleScroll}
      id="itemDetailColumn"
      sx={{
        display: selectedItem ? "block" : "none",
        overflowY: "auto",
        position: "relative",
        height: "100vh",
        backgroundColor: "#f8f8f8",
      }}
      {...swipeHandlers}
    >
      <Box
        sx={{
          filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
          padding: "10px 20px 0px 20px",
          background: "white",
          ...stickyHeaderProperties,
        }}
      >
        <Box sx={{ width: "100%", pl: 0, pb: isCollapsedHeader ? 0 : fr.spacing("1w") }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <LbaItemTags item={{ ...selectedItem, ideaType: LBA_ITEM_TYPE_OLD.FORMATION }} />
            <NavigationButtons goPrev={goPrev} goNext={goNext} handleClose={handleClose} />
          </Box>

          <Box id="detail-header" component="p" color="grey.600" mt={isCollapsedHeader ? 1 : 1} mb={isCollapsedHeader ? 1 : 1}>
            <Typography component="span" sx={{ fontWeight: 700 }}>{`${selectedItem?.company?.name || ""} (${selectedItem.company.place.city})`}</Typography>
            <Typography component="span" fontWeight={400}>
              &nbsp;propose cette formation
            </Typography>
          </Box>

          {!isCollapsedHeader && <JobItemCardHeader selectedItem={selectedItem} kind={kind} isMandataire={isMandataire} />}

          <Typography variant="h3" sx={{ color: fr.colors.decisions.border.default.greenEmeraude.default }}>
            {actualTitle}
          </Typography>

          {!isCollapsedHeader && <ItemDetailCard selectedItem={selectedItem} />}
          {!isCollapsedHeader && <hr style={{ paddingBottom: "1px" }} />}

          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: fr.spacing("4v") }}>
            <Box sx={{ flex: 1 }}>
              {Boolean(appliedDate) && (
                <div>
                  <Typography
                    component="span"
                    className={fr.cx("ri-history-line", "fr-icon--sm", "fr-text--xs")}
                    sx={{
                      px: fr.spacing("4v"),
                      fontStyle: "italic",
                      backgroundColor: fr.colors.decisions.background.contrast.info.default,
                      color: fr.colors.decisions.background.actionHigh.info.default,
                    }}
                  >
                    Super, vous avez déjà pris contact le {appliedDate}.
                  </Typography>
                </div>
              )}
              {elligibleForAppointment && (
                <DemandeDeContact hideButton={Boolean(appliedDate)} isCollapsedHeader={isCollapsedHeader} context={contextPRDV} referrer="LBA" onRdvSuccess={onRdvSuccess} />
              )}
            </Box>
            <ShareLink item={selectedItem} />
          </Box>
        </Box>
      </Box>

      <TrainingDetail training={selectedItem} />

      <AideApprentissage />

      {!elligibleForAppointment && <GoingToContactQuestion kind={kind} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />}

      <Box mt={fr.spacing("6w")} />
      <Footer />
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
        id="detail-content-container"
        sx={{ pb: "0px", mt: fr.spacing("3w"), position: "relative", background: "white", padding: "16px 24px", maxWidth: "970px", mx: { xs: 0, md: "auto" } }}
      >
        <TrainingDescriptionDetails training={training.training} />
        <Box sx={{ backgroundColor: "#f6f6f6", mt: fr.spacing("3w"), p: fr.spacing("4v") }}>
          {training.training.onisepUrl && (
            <div>
              <Typography component="span">Descriptif du {training.training.title} sur&nbsp;</Typography>
              <Typography component="span">
                <DsfrLink href={training.training.onisepUrl} aria-label="Formation sur le site de l'onisep - nouvelle fenêtre">
                  le site Onisep&nbsp;
                </DsfrLink>
              </Typography>
            </div>
          )}
          <Box sx={{ my: fr.spacing("4v") }}>
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

      <Box sx={{ pb: "0px", mt: fr.spacing("3w"), position: "relative", background: "white", padding: "16px 24px", maxWidth: "970px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Quelques informations l'établissement
        </Typography>

        <ItemLocalisation item={training} />

        {training?.contact?.phone && (
          <Typography mt={1}>
            <Typography component="span" fontWeight={700}>
              Téléphone :{" "}
            </Typography>
            <Typography component="span">
              <DsfrLink href={`tel:${training.contact.phone}`} aria-label="Appeler la société au téléphone">
                {training.contact.phone}
              </DsfrLink>
            </Typography>
          </Typography>
        )}

        <ItemGoogleSearchLink item={training} />

        {training.contact.url && (
          <Box sx={{ display: "flex", alignItems: "center", mt: fr.spacing("2w"), flexDirection: "row" }}>
            <Image width={30} height={30} src="/images/icons/small_info.svg" alt="" />

            <Typography component="span">
              En savoir plus sur
              <DsfrLink href={training.contact.url} aria-label="Site de l'entreprise - nouvelle fenêtre">
                {training.contact.url}
              </DsfrLink>
            </Typography>
          </Box>
        )}
      </Box>

      {isCfaDEntreprise && (
        <Box sx={{ pb: "0px", mt: fr.spacing("3w"), position: "relative", background: "white", padding: "16px 24px", maxWidth: "970px", mx: { xs: 0, md: "auto" } }}>
          <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
            Cet établissement est un CFA d&apos;entreprise
          </Typography>

          <Typography>
            La particularité ? Il s&apos;agit d&apos;une formule complète <strong>Emploi + Formation</strong> ! Cette formation vous intéresse ? La marche à suivre diffère selon le
            CFA d&apos;entreprise concerné :
          </Typography>

          <Box sx={{ my: fr.spacing("2w") }}>
            <Box>
              &bull;{" "}
              <Typography component="span" ml={4}>
                Commencez par vous inscrire à la formation pour accéder ensuite au contrat,
              </Typography>
            </Box>
            <Box>
              &bull;{" "}
              <Typography component="span" ml={4}>
                Ou commencez par postuler à une offre d&apos;emploi pour être ensuite inscrit en formation.
              </Typography>
            </Box>
          </Box>

          <Typography>Prenez contact avec cet établissement ou consultez son site web pour en savoir + !</Typography>

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
  const isPermanentEntry = training.sessions?.some((session: any) => session.isPermanentEntry)
  return (
    <>
      {training.description && training.description.length > 30 && (
        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
          <Image width={24} height={24} src="/images/icons/traning-clipboard-list.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Typography sx={{ fontWeight: "700" }}>Description de la formation</Typography>
            <Typography component="span" sx={dontBreakOutCssParameters}>
              {training.description}
            </Typography>
          </Box>
        </Box>
      )}
      {training.objectif && training.objectif.length > 20 && (
        <Box sx={{ display: "flex", alignItems: "flex-start", mt: fr.spacing("2w") }}>
          <Image width={24} height={24} src="/images/icons/training-target.svg" alt="" />
          <Box pl={4} whiteSpace="pre-wrap">
            <Typography sx={{ fontWeight: "700" }}>Objectifs</Typography>
            <Typography component="span" sx={dontBreakOutCssParameters}>
              {training.objectif}
            </Typography>
          </Box>
        </Box>
      )}
      {training.sessions.length ? (
        <Box sx={{ display: "flex", alignItems: "flex-start", mt: fr.spacing("2w") }}>
          <Image width={24} height={24} src="/images/icons/training-academic-cap.svg" alt="" />
          <Box sx={{ pl: 4, whiteSpace: "pre-wrap" }}>
            <Typography sx={{ fontWeight: "700" }}>Sessions de formation</Typography>
            {isPermanentEntry
              ? "Il est possible de s’inscrire à cette formation tout au long de l’année."
              : training["sessions"].map((session: any, i: number) => (
                  <Fragment key={i}>
                    du {formatDate(session.startDate)} au {formatDate(session.endDate)}
                    <br />
                  </Fragment>
                ))}
          </Box>
        </Box>
      ) : null}
    </>
  )
}
