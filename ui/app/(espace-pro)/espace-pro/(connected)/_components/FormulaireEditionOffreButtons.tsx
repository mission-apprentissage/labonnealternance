"use client"

import { Button, Flex } from "@chakra-ui/react"
import { useFormikContext } from "formik"
import { useRouter } from "next/navigation"
import { IJobJson } from "shared/models/job.model"

import { ArrowRightLine } from "@/theme/components/icons"

export const FormulaireEditionOffreButtons = ({ offre, competencesDirty }: { offre?: IJobJson; competencesDirty: boolean }) => {
  const router = useRouter()

  const { isValid, isSubmitting, dirty, submitForm } = useFormikContext<any>()
  return (
    <Flex justify="flex-end">
      <Button variant="secondary" onClick={() => router.back()} mr={4}>
        Annuler
      </Button>
      <Button
        leftIcon={<ArrowRightLine />}
        variant="form"
        isDisabled={!(isValid && (dirty || competencesDirty)) || isSubmitting}
        isActive={isValid && (dirty || competencesDirty)}
        onClick={submitForm}
        data-testid="creer-offre"
      >
        {offre?._id ? "Mettre à jour" : "Créer l'offre"}
      </Button>
    </Flex>
  )
}
