"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import Table from "@codegouvfr/react-dsfr/Table"
import { Box, Typography } from "@mui/material"
import { useId, useState } from "react"
import type { IRgpdErasureMode, IRgpdUserType } from "shared/models/rgpd-erasure.model"
import { RGPD_ERASURE_MODE, RGPD_ERASURE_STATUS, RGPD_USER_TYPE, RGPD_USER_TYPE_LABEL } from "shared/models/rgpd-erasure.model"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { eraseRgpdUser, previewRgpdErasure } from "@/utils/api"
import { ApiError } from "@/utils/api.utils"

type IPreview = Awaited<ReturnType<typeof previewRgpdErasure>>
type IReport = Awaited<ReturnType<typeof eraseRgpdUser>>
type IStep = IPreview["steps"][number]

const MODE_OPTIONS: { value: IRgpdErasureMode; label: string; hint: string }[] = [
  {
    value: RGPD_ERASURE_MODE.ANONYMIZE,
    label: "Anonymiser",
    hint: "Les données nominatives sont supprimées ; une copie sans donnée personnelle (dates, statuts, SIRET) est gardée pour les statistiques.",
  },
  { value: RGPD_ERASURE_MODE.DELETE, label: "Supprimer définitivement", hint: "Aucune copie n'est conservée." },
]

const STATUS_ALERT = {
  [RGPD_ERASURE_STATUS.DONE]: { severity: "success", title: "Effacement terminé" },
  [RGPD_ERASURE_STATUS.PARTIAL]: { severity: "warning", title: "Effacement terminé en base, mais un service externe a échoué : à reprendre à la main" },
  [RGPD_ERASURE_STATUS.FAILED]: { severity: "error", title: "Effacement interrompu : relancez-le une fois l’erreur corrigée, l’utilisateur est toujours trouvable" },
} as const

const normalize = (email: string) => email.trim().toLowerCase()

const errorMessage = (error: unknown) => (error instanceof ApiError && error.context.statusCode < 500 ? error.message : "L’action n’a pas abouti. Réessayez dans un instant.")

const StepsTable = ({ steps, caption }: { steps: IStep[]; caption: string }) => (
  <Table
    caption={caption}
    headers={["Collection", "Action", "Documents"]}
    data={steps.map(({ collection, action, count }) => [<code key="collection">{collection}</code>, action, count ?? "—"])}
    fixed
  />
)

const ConfirmationModal = ({
  isOpen,
  onClose,
  email,
  mode,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  email: string
  mode: IRgpdErasureMode
  onConfirm: () => Promise<void>
}) => {
  const titleId = useId()
  const [typed, setTyped] = useState("")
  const [isPending, setIsPending] = useState(false)
  const matches = normalize(typed) === normalize(email)

  const close = () => {
    setTyped("")
    onClose()
  }

  const confirm = async () => {
    setIsPending(true)
    try {
      await onConfirm()
      close()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={close} ariaLabelledBy={titleId}>
      <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
        <Typography id={titleId} component="h2" className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("2v") }}>
          {mode === RGPD_ERASURE_MODE.DELETE ? "Supprimer définitivement les données" : "Anonymiser les données"}
        </Typography>
        <Typography sx={{ mb: fr.spacing("4v") }}>Cette action est irréversible. Saisissez de nouveau l’adresse e-mail pour confirmer.</Typography>
        <Input label="Adresse e-mail de l’utilisateur" nativeInputProps={{ value: typed, onChange: (event) => setTyped(event.target.value), autoComplete: "off" }} />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: fr.spacing("3v"), mt: fr.spacing("3v") }}>
          <Button priority="secondary" onClick={close}>
            Annuler
          </Button>
          <Button iconId="fr-icon-delete-line" onClick={confirm} disabled={!matches || isPending}>
            Confirmer l’effacement
          </Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}

/** Recherche, aperçu des données touchées, puis effacement : l'aperçu et l'exécution partagent le même calcul côté serveur. */
export function RgpdErasureForm() {
  const [userType, setUserType] = useState<IRgpdUserType>(RGPD_USER_TYPE.ENTREPRISE)
  const [email, setEmail] = useState("")
  const [requestRef, setRequestRef] = useState("")
  const [mode, setMode] = useState<IRgpdErasureMode>(RGPD_ERASURE_MODE.ANONYMIZE)
  const [preview, setPreview] = useState<IPreview | null>(null)
  const [report, setReport] = useState<IReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const confirmation = useDisclosure()

  // Toute modification invalide l'aperçu : on n'efface jamais sur la base d'un aperçu périmé.
  const resetResults = () => {
    setPreview(null)
    setReport(null)
    setError(null)
  }
  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value)
      resetResults()
    }

  const search = async () => {
    resetResults()
    if (!email.trim()) {
      setError("Saisissez l’adresse e-mail de l’utilisateur")
      return
    }
    setIsSearching(true)
    try {
      setPreview(await previewRgpdErasure({ user_type: userType, email, mode }))
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setIsSearching(false)
    }
  }

  const erase = async () => {
    try {
      setReport(await eraseRgpdUser({ user_type: userType, email, mode, request_ref: requestRef.trim() || null }))
      setPreview(null)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v"), maxWidth: "60rem" }}>
      <Typography>
        Traite une demande d’effacement (RGPD, article 17) : les données de l’utilisateur sont retirées de toutes les collections, des caches et de Brevo. La demande est tracée
        sans conserver l’adresse en clair.
      </Typography>

      <RadioButtons
        legend="Type d’utilisateur"
        hintText="Détermine les collections à nettoyer."
        options={Object.values(RGPD_USER_TYPE).map((value) => ({
          label: RGPD_USER_TYPE_LABEL[value],
          nativeInputProps: { checked: userType === value, onChange: () => withReset(setUserType)(value) },
        }))}
      />
      <Input
        label="Adresse e-mail de l’utilisateur"
        nativeInputProps={{ type: "email", value: email, onChange: (event) => withReset(setEmail)(event.target.value), autoComplete: "off" }}
      />
      <Input
        label="Référence de la demande (facultatif)"
        hintText="Numéro de ticket ou de courrier, sans donnée personnelle."
        nativeInputProps={{ value: requestRef, onChange: (event) => setRequestRef(event.target.value), maxLength: 200 }}
      />
      <RadioButtons
        legend="Traitement"
        options={MODE_OPTIONS.map((option) => ({
          label: option.label,
          hintText: option.hint,
          nativeInputProps: { checked: mode === option.value, onChange: () => withReset(setMode)(option.value) },
        }))}
      />
      <Box>
        <Button iconId="fr-icon-search-line" onClick={search} disabled={isSearching}>
          Prévisualiser
        </Button>
      </Box>

      {error && <Alert severity="error" small description={error} />}

      {preview && !preview.found && (
        <Alert
          severity="info"
          small
          description={
            preview.other_user_types.length
              ? `Aucun utilisateur « ${RGPD_USER_TYPE_LABEL[userType]} » ne correspond. L’adresse existe en tant que : ${preview.other_user_types.map((type) => RGPD_USER_TYPE_LABEL[type]).join(", ")}.`
              : `Aucun utilisateur « ${RGPD_USER_TYPE_LABEL[userType]} » ne correspond à cette adresse.`
          }
        />
      )}

      {preview?.found && (
        <>
          {preview.other_user_types.length > 0 && (
            <Alert
              severity="info"
              small
              description={`L’adresse existe aussi en tant que : ${preview.other_user_types.map((type) => RGPD_USER_TYPE_LABEL[type]).join(", ")}. Ces données ne sont pas touchées : traitez chaque type séparément.`}
            />
          )}
          {preview.warnings.map((warning) => (
            <Alert key={warning} severity="warning" small description={warning} />
          ))}
          <StepsTable steps={preview.steps} caption="Données qui seront traitées" />
          <Box>
            <Button iconId="fr-icon-delete-line" onClick={confirmation.onOpen}>
              {mode === RGPD_ERASURE_MODE.DELETE ? "Supprimer définitivement" : "Anonymiser"}
            </Button>
          </Box>
        </>
      )}

      {report && (
        <>
          <Alert severity={STATUS_ALERT[report.status].severity} title={STATUS_ALERT[report.status].title} description={`Trace d’audit : ${report.audit_id}`} />
          {report.failures.map(({ collection, message }, index) => (
            <Alert key={index} severity="error" small description={`${collection} : ${message}`} />
          ))}
          <StepsTable steps={report.steps} caption="Données traitées" />
        </>
      )}

      <ConfirmationModal isOpen={confirmation.isOpen} onClose={confirmation.onClose} email={email} mode={mode} onConfirm={erase} />
    </Box>
  )
}
