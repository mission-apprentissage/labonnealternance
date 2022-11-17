import { Container, Grid, GridItem, Image, Link, Stack, Text } from "@chakra-ui/react"
import logo from "../../assets/images/logo-ministere.svg"

export default () => (
  <Container maxW="container.xl">
    <Grid templateColumns={["1fr", "5fr 7fr"]} gap={5} alignItems="center" pb={4}>
      <GridItem>
        <Image src={logo} w="40%" />
        {/* <Logo size='xl' /> */}
      </GridItem>
      <GridItem>
        <Text pb={4}>
          De nombreux jeunes motivés et disponibles tout de suite cherchent actuellement un contrat d'apprentissage. Ils peuvent correspondre à vos besoins immédiats de
          recrutement.
        </Text>
        <Text pb={4}>L'apprentissage, c'est la garantie de transmettre votre savoir-faire et d'embaucher une future recrue tout en bénéficiant du soutien de l'État.</Text>
        <Stack direction={["column", "row"]} spacing={[5, 10]}>
          <Link href="https://mission-apprentissage.gitbook.io/general/" isExternal>
            <Text fontWeight="bold">Mission Apprentissage</Text>
          </Link>
          <Link href="https://beta.gouv.fr/" isExternal>
            <Text fontWeight="bold">Beta.gouv.fr</Text>
          </Link>
          <Link href="https://www.service-public.fr/" isExternal>
            <Text fontWeight="bold">service-public.fr</Text>
          </Link>
        </Stack>
      </GridItem>
    </Grid>
  </Container>
)
