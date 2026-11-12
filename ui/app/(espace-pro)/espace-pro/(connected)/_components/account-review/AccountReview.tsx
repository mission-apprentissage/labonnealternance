"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Accordion } from "@codegouvfr/react-dsfr/Accordion"
import type { ButtonProps } from "@codegouvfr/react-dsfr/Button"
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup"
import { Box, Typography } from "@mui/material"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import type { IUserStatusValidationJson } from "shared"
import type { CFA, ENTREPRISE, OPCOS_LABEL } from "shared/constants/recruteur"
import { AUTHTYPE, ETAT_UTILISATEUR } from "shared/constants/recruteur"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useUserPermissionsActions } from "@/app/hooks/use-user-permissions-actions"
import { ConfirmationDesactivationUtilisateur, UserValidationHistory } from "@/components/espace_pro"
import { NOT_MY_OPCO_REASON } from "@/components/espace_pro/ConfirmationDesactivationUtilisateur"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { getEntreprisesManagedByCfa, getModerationSummaries } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { AccountStatusBadge } from "../AccountStatusBadge"
import { AccountSummaryHeader } from "../AccountSummaryHeader"
import { EntreprisesGereesParCfa } from "../EntreprisesGereesParCfa"
import InformationLegaleEntreprise from "../InformationLegaleEntreprise"
import { OffresTabs } from "../OffresTabs"
import { SameSiretAccounts, useSameSiretAccounts } from "../SameSiretAccounts"
import { ContactCard } from "./ContactCard"
import { DecisionPanel } from "./DecisionPanel"
import { buildOffersSignal, buildOtherAccountsSignal, buildPartnersSignal, buildValidationSignal, OFFERS_ANCHOR } from "./review-signals"
import { useNextAccountToReview } from "./use-next-account-to-review"

type PendingAction = { label: string; run: () => void | Promise<void> }

/** Fiche de vérification d'un compte entreprise ou CFA, pour un admin ou un OPCO. */
export const AccountReview = ({ userRecruteur, recruiter, onChange }: { userRecruteur: any; recruiter?: any; onChange?: (props: { opco?: OPCOS_LABEL }) => void }) => {
  const { user } = useConnectedSessionClient()
  const viewer = user.type === AUTHTYPE.OPCO ? "OPCO" : "ADMIN"
  const router = useRouter()
  const queryClient = useQueryClient()
  const lastUserState: IUserStatusValidationJson | undefined = userRecruteur.status.at(-1)
  const establishmentLabel: string = userRecruteur.establishment_raison_sociale ?? userRecruteur.establishment_siret
  const isCfa = userRecruteur.type === AUTHTYPE.CFA
  // Seul un admin lit les entreprises partenaires d'un CFA : la route répond en erreur pour un OPCO.
  const showsCfaPartners = isCfa && viewer === "ADMIN"
  const userId: string = userRecruteur._id
  const organizationId: string = userRecruteur.organizationId

  const sameSiretAccounts = useSameSiretAccounts(userId, organizationId)
  const jobs: { _id: string; job_status: string }[] = recruiter?.jobs ?? []
  // Même clé et même découpage que OffresTabs : le cache est partagé.
  const moderationJobIds = jobs.map(({ _id }) => _id).slice(0, 200)
  const moderationSummaries = useQuery({
    queryKey: ["moderation-summaries", moderationJobIds],
    queryFn: () => getModerationSummaries(moderationJobIds),
    enabled: !isCfa && moderationJobIds.length > 0,
  })
  const partners = useQuery({
    queryKey: ["entreprisesGereesParCfa", organizationId],
    queryFn: () => getEntreprisesManagedByCfa(organizationId),
    enabled: showsCfaPartners,
  })
  const next = useNextAccountToReview({ viewer, current: { _id: userId, organizationId } })
  const { activate, waitsForValidation } = useUserPermissionsActions(userId, organizationId)

  const deactivation = useDisclosure()
  const notMyOpco = useDisclosure()
  const unsavedGuard = useDisclosure()
  const [isContactDirty, setIsContactDirty] = useState(false)
  const [contactCardKey, setContactCardKey] = useState(0)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const shouldFocusContact = useRef(false)

  const refresh = useCallback(() => {
    onChange?.({})
    queryClient.invalidateQueries({ queryKey: ["/admin/users-recruteurs"] })
    queryClient.invalidateQueries({ queryKey: ["same-siret-accounts"] })
  }, [onChange, queryClient])

  const guarded = (action: PendingAction) => () => {
    if (isContactDirty) {
      setPendingAction(action)
      unsavedGuard.onOpen()
      return
    }
    action.run()
  }

  const activateAccount = {
    label: "activer",
    run: async () => {
      await activate()
      refresh()
    },
  }
  const deactivateAccount = { label: "désactiver", run: () => deactivation.onOpen() }
  const actions: ButtonProps[] = []
  switch (lastUserState?.status) {
    case ETAT_UTILISATEUR.ATTENTE:
      actions.push(
        { children: "Activer le compte", iconId: "fr-icon-checkbox-circle-line", onClick: guarded(activateAccount) },
        { children: "Désactiver le compte", priority: "secondary", iconId: "fr-icon-close-circle-line", onClick: guarded(deactivateAccount) }
      )
      break
    case ETAT_UTILISATEUR.VALIDE:
      actions.push({ children: "Désactiver le compte", priority: "secondary", iconId: "fr-icon-close-circle-line", onClick: guarded(deactivateAccount) })
      break
    case ETAT_UTILISATEUR.DESACTIVE:
      actions.push({ children: "Réactiver le compte", iconId: "fr-icon-checkbox-circle-line", onClick: guarded({ label: "réactiver", run: activateAccount.run }) })
      break
  }
  if (viewer === "OPCO" && !isCfa && lastUserState?.status !== ETAT_UTILISATEUR.DESACTIVE) {
    actions.push({
      children: "Ne relève pas de mon OPCO",
      priority: "tertiary",
      iconId: "fr-icon-arrow-go-back-line",
      onClick: guarded({ label: "transmettre", run: () => notMyOpco.onOpen() }),
    })
  }

  const signals = [
    buildOtherAccountsSignal({ isLoading: sameSiretAccounts.isLoading, isError: sameSiretAccounts.isError, accounts: sameSiretAccounts.data }),
    buildValidationSignal(lastUserState),
    showsCfaPartners
      ? buildPartnersSignal({ isLoading: partners.isLoading, count: partners.data?.length })
      : buildOffersSignal({ jobs, moderationSummaries: moderationSummaries.data?.jobs }),
  ]

  const returnToContact = () => {
    shouldFocusContact.current = true
    unsavedGuard.onClose()
    setPendingAction(null)
  }

  const focusContactAfterGuard = () => {
    if (!shouldFocusContact.current) return
    shouldFocusContact.current = false
    contactRef.current?.scrollIntoView({ block: "center" })
    contactRef.current?.querySelector<HTMLInputElement>("input, select")?.focus()
  }

  const discardAndRun = async () => {
    const action = pendingAction
    unsavedGuard.onClose()
    setPendingAction(null)
    setIsContactDirty(false)
    setContactCardKey((key) => key + 1)
    await action?.run()
  }

  return (
    <>
      <ConfirmationDesactivationUtilisateur {...deactivation} userRecruteur={userRecruteur} onUpdate={refresh} />

      <ModalReadOnly isOpen={notMyOpco.isOpen} onClose={notMyOpco.onClose} ariaLabelledBy="pas-mon-opco-titre" size="sm">
        <Box sx={{ px: fr.spacing("4v"), pb: fr.spacing("4v"), display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
          <Typography id="pas-mon-opco-titre" component="h2" className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ m: 0 }}>
            Cette entreprise ne relève pas de votre OPCO ?
          </Typography>
          <Typography sx={{ m: 0 }}>
            Le compte repasse en attente de vérification et l'équipe La bonne alternance le prend en charge. L'entreprise n'apparaîtra plus dans votre console de gestion.
          </Typography>
          <ButtonsGroup
            inlineLayoutWhen="always"
            alignment="right"
            buttons={[
              { children: "Annuler", priority: "secondary", onClick: notMyOpco.onClose },
              {
                children: "Confirmer",
                onClick: async () => {
                  // En cas d'échec, le toast d'erreur s'affiche et l'OPCO reste sur la fiche.
                  if (!(await waitsForValidation(NOT_MY_OPCO_REASON))) return
                  notMyOpco.onClose()
                  router.push(next?.href ?? PAGES.static.backOpcoHome.getPath())
                },
              },
            ]}
          />
        </Box>
      </ModalReadOnly>

      <ModalReadOnly
        isOpen={unsavedGuard.isOpen}
        onClose={returnToContact}
        ariaLabelledBy="contact-non-enregistre-titre"
        size="sm"
        disableRestoreFocus
        onExited={focusContactAfterGuard}
      >
        <Box sx={{ px: fr.spacing("4v"), pb: fr.spacing("4v"), display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
          <Typography id="contact-non-enregistre-titre" component="h2" className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ m: 0 }}>
            Des modifications du contact ne sont pas enregistrées
          </Typography>
          <Typography sx={{ m: 0 }}>Enregistrez-les avant de {pendingAction?.label ?? "poursuivre"} le compte, sinon elles seront perdues.</Typography>
          <ButtonsGroup
            inlineLayoutWhen="always"
            alignment="right"
            buttons={[
              { children: `Abandonner et ${pendingAction?.label ?? "poursuivre"}`, priority: "secondary", onClick: discardAndRun },
              { children: "Revenir au contact", onClick: returnToContact },
            ]}
          />
        </Box>
      </ModalReadOnly>

      <Box sx={{ px: fr.spacing("4v"), pb: fr.spacing("16v") }}>
        <Box sx={{ borderBottom: "1px solid #E3E3FD", mb: fr.spacing("8v") }}>
          <AccountSummaryHeader
            account={userRecruteur}
            title={establishmentLabel}
            overline={viewer === "OPCO" && user.scope ? `Compte recruteur · ${user.scope.split(" / ")[0]}` : "Compte recruteur"}
            statusBadge={<AccountStatusBadge status={lastUserState?.status} />}
          />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("8v"), alignItems: "flex-start" }}>
          <Box sx={{ flex: "999 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: fr.spacing("10v") }}>
            <SameSiretAccounts query={sameSiretAccounts} viewer={viewer} />

            <Box component="section" id={OFFERS_ANCHOR} sx={{ scrollMarginTop: fr.spacing("4v") }}>
              {showsCfaPartners ? (
                <EntreprisesGereesParCfa cfaId={organizationId} userId={userId} />
              ) : (
                <OffresTabs
                  caption="Offres de recrutement en alternance"
                  recruiter={recruiter}
                  buildOfferEditionUrl={(offerId) =>
                    PAGES.dynamic
                      .offreUpsert({ offerId, establishment_id: userRecruteur.establishment_id, userType: user.type, userId, raison_sociale: establishmentLabel })
                      .getPath()
                  }
                />
              )}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(2, minmax(0, 1fr))" }, gap: fr.spacing("6v"), alignItems: "start" }}>
              <Box ref={contactRef}>
                <ContactCard
                  key={contactCardKey}
                  account={userRecruteur}
                  establishmentLabel={establishmentLabel}
                  onSaved={(props) => {
                    onChange?.(props)
                    // Un nouveau téléphone ou un nouveau nom change les points communs, donc le signal « Doublon probable ».
                    queryClient.invalidateQueries({ queryKey: ["same-siret-accounts"] })
                  }}
                  onDirtyChange={setIsContactDirty}
                />
              </Box>
              <InformationLegaleEntreprise siret={userRecruteur.establishment_siret} type={userRecruteur.type as typeof CFA | typeof ENTREPRISE} />
            </Box>

            <Accordion label={`Historique du compte (${userRecruteur.status.length} ${userRecruteur.status.length > 1 ? "événements" : "événement"})`} titleAs="h2">
              <UserValidationHistory histories={userRecruteur.status} withHeading={false} />
            </Accordion>
          </Box>

          <DecisionPanel signals={signals} onRetryOtherAccounts={() => sameSiretAccounts.refetch()} actions={actions} next={next} />
        </Box>
      </Box>
    </>
  )
}
