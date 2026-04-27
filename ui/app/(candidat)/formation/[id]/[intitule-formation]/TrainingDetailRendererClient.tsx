"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Container, Typography, useMediaQuery, useTheme } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"
import type { ILbaItemFormation2Json, ILbaItemTraining2 } from "shared"
import type { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { LBA_ITEM_TYPE_OLD, newItemTypeToOldItemType } from "shared/constants/lbaitem"
import { isCfaEntreprise } from "shared/services/isCfaEntreprise"
import { Footer } from "@/app/_components/Footer"
import type { IUseRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { useBuildNavigation } from "@/app/hooks/useBuildNavigation"
import { useFormationPrdvTracker } from "@/app/hooks/useFormationPrdvTracker"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import AideApprentissage from "@/components/ItemDetail/AideApprentissage"
import { BackToTopButton } from "@/components/ItemDetail/BackToTopButton"
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
  const { appliedDate, setPrdvDone } = useFormationPrdvTracker(training.id)

  return <TrainingDetailPage selectedItem={training} appliedDate={appliedDate} resultList={result.displayedItems} rechercheParams={rechercheParams} onRdvSuccess={setPrdvDone} />
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"))
  const { swipeHandlers, goNext, goPrev } = useBuildNavigation({ items: resultList, currentItemId: selectedItem.id, rechercheParams: rechercheParams })
  const handleClose = () => router.push(PAGES.dynamic.recherche(rechercheParams).getPath(), { scroll: false })

  const contextPRDV = {
    cle_ministere_educatif: selectedItem.id,
    etablissement_formateur_entreprise_raison_sociale: selectedItem.company.name,
  }

  const headerRef = useRef<HTMLDivElement>(null)
  const headerHeightRef = useRef(0)
  const [isCollapsedHeader, setIsCollapsedHeader] = useState(false)
  const isCollapsed = isMobile && isCollapsedHeader

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        headerHeightRef.current = headerRef.current.offsetHeight
      }
    }
    updateHeaderHeight()
    window.addEventListener("resize", updateHeaderHeight)
    return () => window.removeEventListener("resize", updateHeaderHeight)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (headerHeightRef.current === 0) return
      const currentScroll = window.scrollY || document.documentElement.scrollTop
      if (!isCollapsedHeader && currentScroll > headerHeightRef.current) {
        setIsCollapsedHeader(true)
      } else if (isCollapsedHeader && currentScroll < headerHeightRef.current) {
        setIsCollapsedHeader(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isCollapsedHeader])

  const { elligibleForAppointment } = selectedItem.training

  return (
    <Box
      id="itemDetailColumn"
      sx={{
        display: selectedItem ? "block" : "none",
        position: "relative",
        backgroundColor: "#f8f8f8",
      }}
      {...swipeHandlers}
    >
      {/* Header sticky pleine largeur — visible uniquement quand on a scrollé au-delà du header carte */}
      {isCollapsedHeader && (
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: "white",
            filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
            boxShadow: "0 4px 12px 0 rgba(0, 0, 18, 0.16)",
          }}
        >
          {isMobile ? (
            <Box
              sx={{
                padding: `${fr.spacing("2v")} ${fr.spacing("4v")}`,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <NavigationButtons goPrev={goPrev} goNext={goNext} handleClose={handleClose} />
            </Box>
          ) : (
            <Container maxWidth="xl" sx={{ px: { xs: 0, lg: "auto" } }}>
              <Box sx={{ padding: "10px 20px 0px 20px", pb: fr.spacing("2v") }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <LbaItemTags item={{ ...selectedItem, ideaType: LBA_ITEM_TYPE_OLD.FORMATION }} />
                  <NavigationButtons goPrev={goPrev} goNext={goNext} handleClose={handleClose} />
                </Box>
                <Typography variant="h3" sx={{ color: fr.colors.decisions.border.default.greenEmeraude.default }}>
                  {actualTitle}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: fr.spacing("4v") }}>
                  <Box sx={{ flex: 1 }}>
                    {elligibleForAppointment && (
                      <DemandeDeContact hideButton={Boolean(appliedDate)} isCollapsedHeader={isCollapsedHeader} context={contextPRDV} referrer="LBA" onRdvSuccess={onRdvSuccess} />
                    )}
                  </Box>
                  <ShareLink item={selectedItem} />
                </Box>
              </Box>
            </Container>
          )}
        </Box>
      )}

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, py: { xs: 0, lg: fr.spacing("6v") }, px: { xs: 0, lg: "auto" } }}>
        <Box role="main" component="main" sx={{ mb: fr.spacing("12v") }}>
          {/* Header carte — toujours dans le flux, scrolle normalement */}
          <Box
            ref={headerRef}
            sx={{
              filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
              borderRadius: { xs: 0, lg: fr.spacing("2v") },
              boxShadow: { xs: "unset", lg: "0 4px 12px 0 rgba(0, 0, 18, 0.16)" },
              padding: "10px 20px 0px 20px",
              backgroundColor: "white",
            }}
          >
            <Box sx={{ width: "100%", pl: 0, pb: fr.spacing("2v") }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <LbaItemTags item={{ ...selectedItem, ideaType: LBA_ITEM_TYPE_OLD.FORMATION }} />
                <NavigationButtons goPrev={goPrev} goNext={goNext} handleClose={handleClose} />
              </Box>

              <Box id="detail-header" component="p" color="grey.600" mt={1} mb={1}>
                <Typography component="span" sx={{ fontWeight: 700 }}>{`${selectedItem?.company?.name || ""} (${selectedItem.company.place.city})`}</Typography>
                <Typography component="span" fontWeight={400}>
                  &nbsp;propose cette formation
                </Typography>
              </Box>

              <JobItemCardHeader selectedItem={selectedItem} kind={kind} isMandataire={isMandataire} />

              <Typography variant="h3" sx={{ color: fr.colors.decisions.border.default.greenEmeraude.default }}>
                {actualTitle}
              </Typography>

              <ItemDetailCard selectedItem={selectedItem} />
              <hr style={{ paddingBottom: "1px" }} />

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
          <Box sx={{ mx: { md: 0, lg: fr.spacing("6v") } }}>
            <TrainingDetail training={selectedItem} />
            <AideApprentissage />
          </Box>
          {!elligibleForAppointment && <GoingToContactQuestion kind={kind} key={getGoingtoId(kind, selectedItem)} item={selectedItem} />}
        </Box>
      </Container>
      {isCollapsed && elligibleForAppointment && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            backgroundColor: "white",
            borderTop: "1px solid",
            borderColor: fr.colors.decisions.border.default.grey.default,
            padding: fr.spacing("3v"),
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: fr.spacing("2v"),
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: fr.spacing("2v") }}>
              <DemandeDeContact hideButton={Boolean(appliedDate)} isCollapsedHeader={isCollapsedHeader} context={contextPRDV} referrer="LBA" onRdvSuccess={onRdvSuccess} />
              <Button
                iconId="fr-icon-arrow-up-line"
                priority="primary"
                size="medium"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Retour en haut de la page"
                title="Retour en haut"
              />
            </Box>
          </Box>
        </Box>
      )}
      {!isMobile && <BackToTopButton />}
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
      <Box id="detail-content-container" sx={{ pb: "0px", mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
        <TrainingDescriptionDetails training={training.training} />
        <Box sx={{ backgroundColor: "#f6f6f6", mt: fr.spacing("6v"), p: 2 }}>
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
      {IJStats.isFetched && IJStats.data ? <StatsInserJeunes stats={IJStats.data} /> : null}
      <Box sx={{ pb: "0px", mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Quelques informations sur l'établissement
        </Typography>

        <ItemLocalisation item={training} />

        {training?.contact?.phone && (
          <Typography
            sx={{
              mt: fr.spacing("2v"),
            }}
          >
            <Typography
              component="span"
              sx={{
                fontWeight: 700,
              }}
            >
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
          <Box sx={{ display: "flex", alignItems: "center", mt: fr.spacing("4v"), flexDirection: "row" }}>
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
        <Box sx={{ pb: "0px", mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
          <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
            Cet établissement est un CFA d&apos;entreprise
          </Typography>

          <Typography>
            La particularité ? Il s&apos;agit d&apos;une formule complète <strong>Emploi + Formation</strong> ! Cette formation vous intéresse ? La marche à suivre diffère selon le
            CFA d&apos;entreprise concerné :
          </Typography>

          <Box sx={{ my: fr.spacing("4v") }}>
            <Box>
              &bull;{" "}
              <Typography
                component="span"
                sx={{
                  ml: fr.spacing("8v"),
                }}
              >
                Commencez par vous inscrire à la formation pour accéder ensuite au contrat,
              </Typography>
            </Box>
            <Box>
              &bull;{" "}
              <Typography
                component="span"
                sx={{
                  ml: fr.spacing("8v"),
                }}
              >
                Ou commencez par postuler à une offre d&apos;emploi pour être ensuite inscrit en formation.
              </Typography>
            </Box>
          </Box>

          <Typography>Prenez contact avec cet établissement ou consultez son site web pour en savoir + !</Typography>

          <Box
            sx={{
              my: fr.spacing("4v"),
            }}
          >
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
          <Box
            sx={{
              pl: fr.spacing("8v"),
              whiteSpace: "pre-wrap",
            }}
          >
            <Typography sx={{ fontWeight: "700" }}>Description de la formation</Typography>
            <Typography component="span" sx={dontBreakOutCssParameters}>
              {training.description}
            </Typography>
          </Box>
        </Box>
      )}
      {training.objectif && training.objectif.length > 20 && (
        <Box sx={{ display: "flex", alignItems: "flex-start", mt: fr.spacing("4v") }}>
          <Image width={24} height={24} src="/images/icons/training-target.svg" alt="" />
          <Box
            sx={{
              pl: fr.spacing("8v"),
              whiteSpace: "pre-wrap",
            }}
          >
            <Typography sx={{ fontWeight: "700" }}>Objectifs</Typography>
            <Typography component="span" sx={dontBreakOutCssParameters}>
              {training.objectif}
            </Typography>
          </Box>
        </Box>
      )}
      {training.sessions.length ? (
        <Box sx={{ display: "flex", alignItems: "flex-start", mt: fr.spacing("4v") }}>
          <Image width={24} height={24} src="/images/icons/training-academic-cap.svg" alt="" />
          <Box sx={{ pl: fr.spacing("8v"), whiteSpace: "pre-wrap" }}>
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
