import React, { useEffect } from 'react'
import { Box, Button, Center, Code, Container, Heading, Text } from '@chakra-ui/react'
import Layout from '../common/components/Layout'
import { Breadcrumb } from '../common/components/Breadcrumb'
import { setTitle } from '../common/utils/pageUtils'

/**
 * @description WidgetTutorial page.
 * @returns {JSX.Element}
 */
const WidgetTutorial = () => {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/assets/widget.min.js'
    script.onload = () => window.initPrdvWidget()
    document.head.appendChild(script)
  }, [])

  const title = 'Widget'
  setTitle(title)

  return (
    <Layout>
      <Box w='100%' pt={[4, 8]} px={[1, 1, 12, 24]}>
        <Container maxW='xl'>
          <Breadcrumb pages={[{ title: 'Accueil', to: '/' }, { title: title }]} />
          <Heading textStyle='h2' color='grey.800' mt={5}>
            {title}
          </Heading>
          <Box pt={1} pb={16}>
            <Text textStyle='h1' fontWeight='bold' color='grey.800'>
              Exemple d'intégration du Widget RDV Apprentissage"
            </Text>
            <Text mt={9}>
              Pour intégrer le widget "RDV Apprentissage" sur votre site internet, il vous suffit de suivre les étapes
              suivantes:
            </Text>
          </Box>
          <Box pl={2} mt={2}>
            <Text textStyle='h4' fontWeight='bold' color='grey.800'>
              Etape 1 :
            </Text>
            <Text mt={3}>
              Insérez le script ci-dessous dans la balise <Code>{'<Head>'}</Code>
            </Text>
            <Code p={2} mt={4}>
              {'<script src="https://rdv-cfa.apprentissage.beta.gouv.fr/assets/widget.min.js"></script>'}
            </Code>
          </Box>
          <Box pl={2} mt={8}>
            <Text textStyle='h4' fontWeight='bold' color='grey.800'>
              Etape 2 :
            </Text>
            <Text mt={3}>
              Insérez la balise ci-dessous avec l'attribut <Code>id-rco-formation</Code> correspondant à la formation à
              afficher et insérez l'attribut <Code>referrer</Code> correspondant à votre plateforme de diffusion.
            </Text>
            <Code p={2} mt={4}>
              {
                '<div class="widget-prdv" data-id-rco-formation="03_2064746F|03_1133802|104237" data-referrer="lba"></div>'
              }
            </Code>
          </Box>

          <Box pl={2} mt={8}>
            <Text textStyle='h4' fontWeight='bold' color='grey.800'>
              Etape 3 :
            </Text>
            <Text mt={3}>Déclenchez l'apparition des widgets</Text>
            <Code p={2} mt={4}>
              window.initPrdvWidget()
            </Code>
          </Box>
          <Box pl={2} mt={12}>
            <Center>
              <Text textStyle='h4' fontWeight='bold' color='grey.800'>
                Exemple d'affichage d'un widget 🎉
              </Text>
            </Center>
          </Box>
          <Box textAlign={'center'} mt={12} mb={14} className='widget-example'>
            <Button variant='secondary' onClick={() => document.querySelector('div.widget-prdv > a').click()}>
              <div className='widget-prdv' data-id-rco-formation='03_2064746F|03_1133802|104237' data-referrer='lba' />
            </Button>
          </Box>
        </Container>
      </Box>
    </Layout>
  )
}

export default WidgetTutorial
