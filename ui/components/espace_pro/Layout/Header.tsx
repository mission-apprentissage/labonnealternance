import { Box, Button, Container, Flex, Icon, Image, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Spacer, Text } from "@chakra-ui/react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useContext } from "react"
import { RiAccountCircleLine } from "react-icons/ri"

import InfoBanner from "@/components/InfoBanner/InfoBanner"
import { useAuth } from "@/context/UserContext"
import { apiGet } from "@/utils/api.utils"

import { AUTHTYPE } from "../../../common/contants"
import { LogoContext } from "../../../context/contextLogo"
import { LockFill } from "../../../theme/components/icons"
import { LbaNew } from "../../../theme/components/logos_pro"
import LogoAkto from "../assets/images/akto"

const Header = () => {
  const { organisation } = useContext(LogoContext)
  const { user, setUser } = useAuth()

  const router = useRouter()

  const handleLogout = async () => {
    await apiGet("/auth/logout", {})
    setUser()
    router.push("/")
  }

  return (
    <Box>
      <InfoBanner />
      <Container maxW="full" px={[0, 4]} py={4} borderBottom={"1px solid"} borderColor="grey.400">
        <Container maxW="container.xl">
          <Flex alignItems="center" px={[0, 4]}>
            <Link href="/" aria-label="Retour à la page d'accueil">
              <Flex direction="row" align="center" px={[0, 4]}>
                <Image src="/images/espace_pro/logo.svg" alt="marianne" />
                <LbaNew ml={4} w="143px" h="37px" />
              </Flex>
            </Link>
            {organisation?.includes("akto") && <LogoAkto display={["none", "flex"]} w="100px" h={6} />}
            <Spacer />
            {!user && (
              <Button onClick={() => router.push("/espace-pro/authentification")} fontWeight="normal" variant="pill" color="bluefrance.500" leftIcon={<LockFill w={3} h={3} />}>
                Connexion
              </Button>
            )}

            {user && (
              <Menu>
                <MenuButton as={Button} variant="pill">
                  <Flex alignItems="center">
                    <Icon as={RiAccountCircleLine} color="bluefrance.500" />
                    <Box display={["none", "block"]} ml={2}>
                      <Text color="bluefrance.500" data-testid="logged-name">
                        {user.first_name} {user.last_name}
                      </Text>
                    </Box>
                  </Flex>
                </MenuButton>
                <MenuList>
                  {user.type !== AUTHTYPE.OPCO && <MenuItem onClick={() => router.push("/espace-pro/compte")}>Mes informations</MenuItem>}
                  {user.type !== AUTHTYPE.ENTREPRISE && user.type !== AUTHTYPE.OPCO && user.type !== AUTHTYPE.ADMIN && (
                    <>
                      <MenuItem onClick={() => router.push("/espace-pro/administration")}>Gestion des offres</MenuItem>
                      <MenuDivider />
                    </>
                  )}
                  {user.type === AUTHTYPE.ADMIN && (
                    <>
                      <MenuItem onClick={() => router.push("/espace-pro/administration/users")}>Gestion des recruteurs</MenuItem>
                      <MenuItem onClick={() => router.push("/espace-pro/admin/utilisateurs")}>Gestion des administrateurs</MenuItem>
                      <MenuItem onClick={() => router.push("/espace-pro/admin")}>Rendez-vous Apprentissage</MenuItem>
                      <MenuDivider />
                    </>
                  )}
                  <MenuItem onClick={handleLogout}>Déconnexion</MenuItem>
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
