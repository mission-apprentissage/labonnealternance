import { Alert, AlertIcon, Box, Button, Container, Flex, Icon, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Spacer, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useContext } from "react"
// eslint-disable-next-line import/no-extraneous-dependencies
import { RiAccountCircleLine } from "react-icons/ri" // TODO_AB

import { AUTHTYPE } from "../../../common/contants"
import useAuth from "../../../common/hooks/useAuth"
import { publicConfig } from "../../../config.public"
import { LogoContext } from "../../../context/contextLogo"
import { LockFill } from "../../../theme/components/icons"
import { LbaNew } from "../../../theme/components/logos_pro"
import LogoAkto from "../assets/images/akto"

import Logo from "./Logo"

const Header = () => {
  const { organisation } = useContext(LogoContext)
  const [auth, setAuth] = useAuth()
  const router = useRouter()

  return (
    <Box>
      {publicConfig.baseUrl.includes("recette") && (
        <Alert status="info" variant="top-accent" justifyContent="center">
          <AlertIcon />
          Environnement de test
        </Alert>
      )}
      <Container maxW="full" px={[0, 4]} py={4} borderBottom={"1px solid"} borderColor="grey.400">
        <Container maxW="container.xl">
          <Flex alignItems="center" px={[0, 4]}>
            <Logo display={["none", "flex"]} />
            <LbaNew />
            {organisation?.includes("akto") && <LogoAkto display={["none", "flex"]} w="100px" h={6} />}
            <Spacer />
            {auth.sub === "anonymous" && (
              <Button onClick={() => router.push("/authentification")} fontWeight="normal" variant="pill" color="bluefrance.500" leftIcon={<LockFill w={3} h={3} />}>
                Connexion
              </Button>
            )}

            {auth.sub !== "anonymous" && (
              <Menu>
                <MenuButton as={Button} variant="pill">
                  <Flex alignItems="center">
                    <Icon as={RiAccountCircleLine} color="bluefrance.500" />
                    <Box display={["none", "block"]} ml={2}>
                      <Text color="bluefrance.500">
                        {auth.first_name} {auth.last_name}
                      </Text>
                    </Box>
                  </Flex>
                </MenuButton>
                <MenuList>
                  {auth.sub !== "anonymous" && (
                    <>
                      {auth.type !== AUTHTYPE.OPCO && <MenuItem onClick={() => router.push("/compte")}>Mes informations</MenuItem>}
                      {auth.type !== AUTHTYPE.ENTREPRISE && auth.type !== AUTHTYPE.OPCO && auth.type !== AUTHTYPE.ADMIN && (
                        <>
                          <MenuItem onClick={() => router.push("/administration")}>Gestion des offres</MenuItem>
                          <MenuDivider />
                        </>
                      )}
                    </>
                  )}
                  {auth.type === AUTHTYPE.ADMIN && (
                    <>
                      <MenuItem onClick={() => router.push("/administration/users")}>Gestion des utilisateurs</MenuItem>
                      <MenuDivider />
                    </>
                  )}
                  <MenuItem onClick={() => setAuth("")}>Déconnexion</MenuItem>
                </MenuList>
              </Menu>
            )}
          </Flex>
        </Container>
      </Container>
    </Box>
  )
}

export default Header
