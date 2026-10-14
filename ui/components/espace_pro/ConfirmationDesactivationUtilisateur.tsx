"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, Typography } from "@mui/material"
import { useRef, useState } from "react"
import type { IUserRecruteurJson } from "shared"
import type { useDisclosure } from "@/app/hooks/use-disclosure"
import { useUserPermissionsActions } from "@/app/hooks/use-user-permissions-actions"
import { AUTHTYPE } from "@/common/contants"
import { ModalReadOnly } from "@/components/ModalReadOnly"

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
  const autreRef = useRef<HTMLInputElement>(null)
  const { deactivate: disableUser, waitsForValidation: reassignUserToAdmin } = useUserPermissionsActions(_id, organizationId)

  if (!userRecruteur) return null

  const isAutre = motif === "Autre"
  const reason = isAutre ? autre.trim() : motif
  const motifError = showErrors && !motif ? "Sélectionnez un motif de désactivation" : null
  const autreError = showErrors && isAutre && reason.length < 3 ? "Précisez le motif en 3 caractères minimum" : null

  const close = () => {
    setMotif("")
    setAutre("")
    setShowErrors(false)
    onClose()
  }

  const handleUpdate = async () => {
    if (!motif || (isAutre && reason.length < 3)) {
      setShowErrors(true)
      const firstInvalidField = motif ? autreRef : motifRef
      firstInvalidField.current?.focus()
      return
    }
    switch (type) {
      case AUTHTYPE.ENTREPRISE:
        if (reason === "Ne relève pas des champs de compétences de mon OPCO") {
          await reassignUserToAdmin(reason)
        } else {
          await disableUser(reason)
        }
        break

      case AUTHTYPE.CFA:
      case AUTHTYPE.ADMIN:
        await disableUser(reason)
        break
      default:
        throw new Error(`unsupported type: ${type}`)
    }
    onUpdate?.({ reason })
    close()
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={close}>
      <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
        <Typography className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("2v") }} component="h2">
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
            <option value="Siret ou information non conforme à l'identité déclarée ">Siret ou information non conforme à l'identité déclarée </option>
            <option value="Compte créé par un étudiant">Compte créé par un étudiant</option>
            <option value="Compte entreprise créé par un CFA">Compte entreprise créé par un CFA</option>
            <option value="Compte en doublon">Compte en doublon</option>
            {type === "CFA" && <option value="Non référencé dans le catalogue du Réseau des Carif-Oref">Non référencé dans le catalogue du Réseau des Carif-Oref</option>}
            <option value="Ne relève pas des champs de compétences de mon OPCO">Ne relève pas des champs de compétences de mon OPCO</option>
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
                hintText="3 caractères minimum"
                state={autreError ? "error" : "default"}
                stateRelatedMessage={autreError}
                nativeInputProps={{
                  ref: autreRef,
                  type: "text",
                  name: "autre",
                  required: true,
                  minLength: 3,
                  value: autre,
                  onChange: (e) => setAutre(e.target.value),
                  "aria-invalid": Boolean(autreError),
                }}
              />
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
