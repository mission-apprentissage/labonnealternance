import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Flex, Heading, Link, Progress, Text } from "@chakra-ui/react"
import styled from "@emotion/styled"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useQuery } from "react-query"

import image from "@/public/assets/checkbox-list.webp"
import { getRomeDetail } from "@/utils/api"

import { RomeDetail } from "./RomeDetail"

const fakeLoadingDuration = 1000

export const RomeDetailWithQuery = ({
  rome,
  onChange,
  selectedCompetences,
  title,
}: {
  rome: string
  onChange: (selectedCompetences: Record<string, string[]>) => void
  selectedCompetences: Record<string, string[]>
  title: string
}) => {
  const [fakeLoading, setFakeLoading] = useState<{ id: string; isLoading: boolean }>({ id: new Date().toISOString(), isLoading: true })
  const {
    data: romeReferentiel,
    isLoading,
    error,
  } = useQuery(["getRomeDetail", rome], () => getRomeDetail(rome), {
    retry: false,
  })

  useEffect(() => {
    const id = new Date().toISOString()
    setFakeLoading({ id, isLoading: true })
    const timeoutId = setTimeout(() => {
      setFakeLoading({ id, isLoading: false })
    }, fakeLoadingDuration)
    return () => clearTimeout(timeoutId)
  }, [rome, setFakeLoading])

  const setCompetenceSelection = (groupKey: string, competence: string, selected: boolean) => {
    let group = selectedCompetences[groupKey]
    if (!group) {
      group = []
    }
    group = [...group]
    const groupIndex = group.indexOf(competence)
    const isInGroup = groupIndex !== -1
    if (!selected && isInGroup) {
      group.splice(groupIndex, 1)
    } else if (selected && !isInGroup) {
      group.push(competence)
    }
    onChange({
      ...selectedCompetences,
      [groupKey]: group,
    })
  }

  return isLoading || fakeLoading.isLoading ? (
    <LoadingBox />
  ) : error ? (
    <Box border="1px solid #000091" p={5}>
      <Heading mb={3}>{title}</Heading>
      <Text fontSize="14px">
        La fiche métier n'a pas pu être trouvée, merci de le{" "}
        <Link
          aria-label="Envoi d'un email à l'équipe La bonne alternance - nouvelle fenêtre"
          href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Dépôt%20offre%20-%20ROME%20manquant"
          variant="basicUnderlinedBlue"
          isExternal
        >
          signaler à notre équipe support <ExternalLinkIcon mx="2px" />
        </Link>{" "}
        en précisant le métier cherché
      </Text>
    </Box>
  ) : (
    <RomeDetail title={title} romeReferentiel={romeReferentiel} onChange={setCompetenceSelection} selectedCompetences={selectedCompetences} />
  )
}

const LoadingBoxDiv = styled.div`
  border: solid 1px #000091;
  height: 430px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .title {
    font-size: 16px;
    font-weight: 700;
    margin: 24px 0px;
  }
`

const LoadingBox = () => {
  return (
    <LoadingBoxDiv>
      <Flex alignItems="center" flexDirection="column" width="100%">
        <Image src={image} width={80} alt="" />
        <Text className="title">Génération du descriptif de l’offre</Text>
        <Progress width="80%" isIndeterminate size="sm" borderRadius="20px" />
      </Flex>
    </LoadingBoxDiv>
  )
}
