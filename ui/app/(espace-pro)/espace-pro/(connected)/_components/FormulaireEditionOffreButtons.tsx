"use client"

import { Box, Flex } from "@chakra-ui/react"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { useFormikContext } from "formik"
import { useRouter } from "next/navigation"
import { IJobJson } from "shared/models/job.model"

import { ArrowRightLine } from "@/theme/components/icons"

export const FormulaireEditionOffreButtons = ({ offre, competencesDirty }: { offre?: IJobJson; competencesDirty: boolean }) => {
  const router = useRouter()

  const { isValid, isSubmitting, dirty, submitForm } = useFormikContext<any>()
  return (
    <Flex justify="flex-end">
      <Box mr={4}>
        <Button className="fr-btn--secondary" onClick={() => router.back()}>
          Annuler
        </Button>
      </Box>
      <Button disabled={!(isValid && (dirty || competencesDirty)) || isSubmitting} onClick={submitForm} data-testid="creer-offre">
        <ArrowRightLine mr={2} />
        {offre?._id ? "Mettre à jour" : "Créer l'offre"}
      </Button>
    </Flex>
  )
}
