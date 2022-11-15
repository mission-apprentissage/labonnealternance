import { useEffect, useState } from 'react'
import { Box, Container, Flex, Text, Divider } from '@chakra-ui/react'
import { useParams } from 'react-router'
import { _get, _post } from '../common/httpClient'
import Rocket from '../common/components/Rocket'
import LocationIcon from '../common/components/LocationIcon'

/**
 * @description AppointmentFollowUpPage component.
 * @returns {JSX.Element}
 */
const AppointmentFollowUpPage = () => {
  const { id, action } = useParams()
  const [data, setData] = useState()

  const actions = {
    CONFIRM: 'confirm',
    RESEND: 'resend',
  }

  useEffect(async () => {
    const response = await _get(`/api/appointment-request/${id}/candidat/follow-up`)

    setData(response)

    if (!response.formAlreadySubmit) {
      await _post(`/api/appointment-request/${id}/candidat/follow-up`, {
        action: action.toUpperCase(),
      })
    }
  }, [id, action])

  // Display nothing until date isn't received
  if (!data) {
    return null
  }

  return (
    <Container fontFamily='Inter' bg='#E5E5E5' minH={'100vh'} minW={'100%'} pb={40}>
      <Container maxW='800px'>
        <Box w='100%' align={'center'} pt={14}>
          <Rocket width={'100%'} />
        </Box>
      </Container>
      <Container maxW='800px' py={20} boxShadow='0px 0px 24px rgba(30, 30, 30, 0.24)' bg='#FFFFFF'>
        {action === actions.RESEND && !data.appointment.candidat_contacted_at && (
          <>
            <Flex px={91}>
              <Box w='100%'>
                <Text textStyle='h3' fontSize='28px' fontWeight='700' color='info' align='center'>
                  Votre demande de contact <br />a bien été renvoyée au centre de formation :
                </Text>
              </Box>
            </Flex>
            <Flex px={91} pt={4}>
              <Box w='100%'>
                <Text fontSize='16px' fontWeight='700' color='grey.750'>
                  {data.etablissement.raison_sociale}
                </Text>
              </Box>
            </Flex>
            <Flex px={91} pt={1} mb={10}>
              <Box w='16px'>
                <LocationIcon width={16} />
              </Box>
              <Box w='100%' pl={2}>
                <Text fontSize='14px' fontWeight='400' color='grey.750'>
                  {data.etablissement.adresse}, {data.etablissement.code_postal} {data.etablissement.localite}
                </Text>
              </Box>
            </Flex>
          </>
        )}
        {action === actions.RESEND && data.appointment.candidat_contacted_at && (
          <>
            <Flex px={91}>
              <Box w='100%'>
                <Text textStyle='h3' fontSize='28px' fontWeight='700' color='info' align='center'>
                  Votre réponse a déjà été prise en compte !
                </Text>
              </Box>
            </Flex>
            <Flex px={91} pt={4} mb={20}>
              <Box w='100%'>
                <Text fontSize='16px' fontWeight='700' color='grey.750' align='center'>
                  Merci pour vos retours qui nous aident à améliorer nos services
                </Text>
              </Box>
            </Flex>
          </>
        )}
        {action === actions.CONFIRM && (
          <>
            <Flex px={91}>
              <Box w='100%'>
                <Text textStyle='h3' fontSize='28px' fontWeight='700' color='info' align='center'>
                  Votre réponse a bien été prise en compte !
                </Text>
              </Box>
            </Flex>
            <Flex px={91} pt={4} mb={20}>
              <Box w='100%'>
                <Text fontSize='16px' fontWeight='700' color='grey.750' align='center'>
                  Merci pour vos retours qui nous aident à améliorer nos services
                </Text>
              </Box>
            </Flex>
          </>
        )}
        <Flex px={85}>
          <Divider color='#D0C9C4' />
        </Flex>
        <Flex px={65} mt={4}>
          <Box w='100%'>
            <Text fontSize='14px' color='grey.750'>
              <b>RDV Apprentissage</b> est un outil développé par la{' '}
              <u>
                <a href='https://mission-apprentissage.gitbook.io/general/' target='_blank' rel='noreferrer'>
                  Mission interministérielle pour l’apprentissage
                </a>
              </u>
            </Text>
          </Box>
        </Flex>
      </Container>
    </Container>
  )
}

export default AppointmentFollowUpPage
