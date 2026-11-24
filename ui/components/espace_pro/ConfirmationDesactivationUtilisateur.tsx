"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, Typography } from "@mui/material"
import { useId, useRef, useState } from "react"
import type { IUserRecruteurJson } from "shared"
import { DEACTIVATION_REASON_MAX_LENGTH, DEACTIVATION_REASON_MIN_LENGTH, ZDeactivationReason } from "shared/models/role-management.model"
import { LiveStatus } from "@/app/_components/LiveStatus"
import type { useDisclosure } from "@/app/hooks/use-disclosure"
import { useUserPermissionsActions } from "@/app/hooks/use-user-permissions-actions"
import { AUTHTYPE } from "@/common/contants"
import { ModalReadOnly } from "@/components/ModalReadOnly"

export const NOT_MY_OPCO_REASON = "Ne relève pas des champs de compétences de mon OPCO"

const ConfirmationDesactivationUtilisateur = ({
  userRecruteur,
  onClose,
  isOpen,
  onUpdate,
}: { userRecruteur?: IUserRecruteurJson & { organizationId?: string }; onUpdate?: (props: { reason: string }) => void } & ReturnType<typeof useDisclosure>) => {
  const { establishment_raison_sociale, _id: _idObject, type, organizationId = "" } = userRecruteur ?? {}
  const _id = (_idObject ?? "").toString()
  const [motif, setMotif] = useState("")
  const [autre, setAutre] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const motifRef = useRef<HTMLSelectElement>(null)
  const autreRef = useRef<HTMLTextAreaElement>(null)
  const titleId = useId()
  const autreCounterId = useId()
  const { deactivate: disableUser, waitsForValidation: reassignUserToAdmin } = useUserPermissionsActions(_id, organizationId)

  if (!userRecruteur) return null

  const isAutre = motif === "Autre"
  const reason = isAutre ? autre.trim() : motif
  const motifError = showErrors && !motif ? "Sélectionnez un motif de désactivation" : null
  const isAutreInvalid = isAutre && !ZDeactivationReason.safeParse(autre).success
  const autreError = showErrors && isAutreInvalid ? `Précisez le motif en ${DEACTIVATION_REASON_MIN_LENGTH} caractères minimum et ${DEACTIVATION_REASON_MAX_LENGTH} maximum` : null

  const close = () => {
    setMotif("")
    setAutre("")
    setShowErrors(false)
    onClose()
  }

  const handleUpdate = async () => {
    if (!motif || isAutreInvalid) {
      setShowErrors(true)
      const firstInvalidField = motif ? autreRef : motifRef
      firstInvalidField.current?.focus()
      return
    }
    let isUpdated: boolean
    switch (type) {
      case AUTHTYPE.ENTREPRISE:
        isUpdated = reason === NOT_MY_OPCO_REASON ? await reassignUserToAdmin(reason) : await disableUser(reason)
        break

      case AUTHTYPE.CFA:
      case AUTHTYPE.ADMIN:
        isUpdated = await disableUser(reason)
        break
      default:
        throw new Error(`unsupported type: ${type}`)
    }
    // En cas d'échec, le toast d'erreur s'affiche et la modale garde le motif saisi.
    if (!isUpdated) return
    onUpdate?.({ reason })
    close()
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={close} ariaLabelledBy={titleId}>
      <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
        <Typography id={titleId} className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("2v") }} component="h2">
          Désactivation du compte
        </Typography>

        <Box sx={{ pb: fr.spacing("2v") }}>
          <Typography sx={{ mb: 1, color: "#3A3A3A", lineHeight: "24px" }}>
            Vous êtes sur le point de désactiver le compte de l’entreprise {establishment_raison_sociale}. Pouvez-vous nous préciser pour quelle raison ?
          </Typography>

          <Select
            label="Motif de désactivation (obligatoire)"
            state={motifError ? "error" : "default"}
            stateRelatedMessage={motifError}
            nativeSelectProps={{ ref: motifRef, name: "motif", required: true, value: motif, onChange: (e) => setMotif(e.target.value), "aria-invalid": Boolean(motifError) }}
          >
            <option value="" hidden>
              Sélectionnez un motif
            </option>
            <option value="Siret ou information non conforme à l'identité déclarée">Siret ou information non conforme à l'identité déclarée</option>
            <option value="Compte créé par un étudiant">Compte créé par un étudiant</option>
            <option value="Compte entreprise créé par un CFA">Compte entreprise créé par un CFA</option>
            <option value="Compte en doublon">Compte en doublon</option>
            <option value="Offre non conforme">Offre non conforme</option>
            {type === "CFA" && <option value="Non référencé dans le catalogue du Réseau des Carif-Oref">Non référencé dans le catalogue du Réseau des Carif-Oref</option>}
            <option value={NOT_MY_OPCO_REASON}>{NOT_MY_OPCO_REASON}</option>
            <option value="Besoin de recrutement pourvu">Besoin de recrutement pourvu</option>
            <option value="Injoignable">Injoignable</option>
            <option value="Autre">Autre</option>
          </Select>
        </Box>

        {isAutre && (
          <Box sx={{ pb: fr.spacing("2v") }}>
            <Box sx={{ mb: 1, color: "#3A3A3A", lineHeight: "24px" }}>
              <Input
                label="Précisez le motif (obligatoire)"
                hintText={`${DEACTIVATION_REASON_MIN_LENGTH} caractères minimum, ${DEACTIVATION_REASON_MAX_LENGTH} maximum`}
                state={autreError ? "error" : "default"}
                stateRelatedMessage={autreError}
                textArea
                nativeTextAreaProps={{
                  ref: autreRef,
                  name: "autre",
                  required: true,
                  minLength: DEACTIVATION_REASON_MIN_LENGTH,
                  maxLength: DEACTIVATION_REASON_MAX_LENGTH,
                  rows: 4,
                  value: autre,
                  onChange: (e) => setAutre(e.target.value),
                  "aria-invalid": Boolean(autreError),
                  "aria-describedby": autreCounterId,
                }}
                style={{ marginBottom: 0 }}
              />
              {/* « N / 500 » se lit « barre oblique » : les lecteurs d'écran reçoivent « N caractères sur 500 ». */}
              <Typography id={autreCounterId} className={fr.cx("fr-hint-text")} sx={{ mt: fr.spacing("1v"), mb: 0, textAlign: "right" }}>
                <span aria-hidden="true">
                  {autre.length} / {DEACTIVATION_REASON_MAX_LENGTH} caractères
                </span>
                <span className={fr.cx("fr-sr-only")}>
                  {autre.length} {autre.length > 1 ? "caractères" : "caractère"} sur {DEACTIVATION_REASON_MAX_LENGTH}
                </span>
              </Typography>
              {/* maxLength bloque la frappe sans retour : la limite atteinte est annoncée. */}
              <LiveStatus message={autre.length >= DEACTIVATION_REASON_MAX_LENGTH ? `Vous avez atteint la limite de ${DEACTIVATION_REASON_MAX_LENGTH} caractères.` : ""} />
            </Box>
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", mt: fr.spacing("3v") }}>
          <Box
            sx={{
              mr: fr.spacing("3v"),
            }}
          >
            <Button priority="secondary" onClick={close}>
              Annuler
            </Button>
          </Box>
          <Button onClick={async () => handleUpdate()}>Désactiver le compte</Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}

export default ConfirmationDesactivationUtilisateur
