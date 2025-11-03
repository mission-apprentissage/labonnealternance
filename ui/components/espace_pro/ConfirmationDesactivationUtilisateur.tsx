"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, Typography } from "@mui/material"
import { useState } from "react"
import { IUserRecruteurJson } from "shared"

import { useDisclosure } from "@/common/hooks/useDisclosure"
import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"
import { ModalReadOnly } from "@/components/ModalReadOnly"

import { AUTHTYPE } from "../../common/contants"

const ConfirmationDesactivationUtilisateur = ({
  userRecruteur,
  onClose,
  isOpen,
  onUpdate,
}: { userRecruteur?: IUserRecruteurJson; onUpdate?: (props: { reason: string }) => void } & ReturnType<typeof useDisclosure>) => {
  const { establishment_raison_sociale, _id: _idObject, type } = userRecruteur ?? {}
  const _id = (_idObject ?? "").toString()
  const [reason, setReason] = useState<string>()
  const reasonComment = useDisclosure()
  const { deactivate: disableUser, waitsForValidation: reassignUserToAdmin } = useUserPermissionsActions(_id)

  if (!userRecruteur) return null

  const handleReason = (value: string) => {
    if (value === "Autre") {
      reasonComment.onOpen()
    } else {
      reasonComment.onClose()
      setReason(value)
    }
  }

  const handleUpdate = async () => {
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
    onClose()
    reasonComment.onClose()
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose}>
      <Box sx={{ pb: fr.spacing("2w"), px: fr.spacing("2w") }}>
        <Typography className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("1w") }} component="h2">
          Désactivation du compte
        </Typography>

        <Box sx={{ pb: fr.spacing("1w") }}>
          <Typography sx={{ mb: 1, color: "#3A3A3A", lineHeight: "24px" }}>
            Vous êtes sur le point de désactiver le compte de l’entreprise {establishment_raison_sociale}. Pouvez-vous nous préciser pour quelle raison ?
          </Typography>

          <Select label="Motif de refus" nativeSelectProps={{ name: "motif", required: true, onChange: (e) => handleReason(e.target.value) }}>
            <option value="" hidden>
              Sélectionnez un motif
            </option>
            <option value="Siret ou information non conforme à l'identité déclarée ">Siret ou information non conforme à l'identité déclarée </option>
            <option value="Compte créé par un étudiant">Compte créé par un étudiant</option>
            <option value="Compte entreprise créé par un CFA">Compte entreprise créé par un CFA</option>
            <option value="Compte en doublon">Compte en doublon</option>
            {type === "CFA" && <option value="Non référencé dans le catalogue du Réseau des Carif-Oref">Non référencé dans le catalogue</option>}
            <option value="Ne relève pas des champs de compétences de mon OPCO">Ne relève pas des champs de compétences de mon OPCO</option>
            <option value="Besoin de recrutement pourvu">Besoin de recrutement pourvu</option>
            <option value="Injoignable">Injoignable</option>
            <option value="Autre">Autre</option>
          </Select>
        </Box>

        {reasonComment.isOpen && (
          <Box sx={{ pb: fr.spacing("1w") }}>
            <Typography sx={{ mb: 1, color: "#3A3A3A", lineHeight: "24px" }}>
              <Input label="Autre" nativeInputProps={{ type: "text", name: "autre", minLength: 3, onChange: (e) => setReason(e.target.value) }} />
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", mt: fr.spacing("3v") }}>
          <Box mr={fr.spacing("3v")}>
            <Button
              priority="secondary"
              onClick={() => {
                onClose()
                setReason(null)
              }}
            >
              Annuler
            </Button>
          </Box>
          <Button onClick={() => handleUpdate()} disabled={!reason}>
            Supprimer
          </Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}

export default ConfirmationDesactivationUtilisateur
