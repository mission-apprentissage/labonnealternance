"use client"

import { Box, Button, Container, Flex, Icon, Image, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Spacer, Text } from "@chakra-ui/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useContext } from "react"
import { RiAccountCircleLine } from "react-icons/ri"

import InfoBanner from "@/components/InfoBanner/InfoBanner"
import { useAuth } from "@/context/UserContext"
import { apiGet } from "@/utils/api.utils"

import { AUTHTYPE } from "../../../common/contants"
import { LogoContext } from "../../../context/contextLogo"
import { LockFill } from "../../../theme/components/icons"
import { LbaNew } from "../../../theme/components/logos"
import LogoAkto from "../assets/images/akto"

const Header = () => {
  const { organisation } = useContext(LogoContext)
  const { user } = useAuth()

  const router = useRouter()

  const handleLogout = async () => {
    await apiGet("/auth/logout", {})
    router.push("/")
  }

  return (
    <Box>
      <InfoBanner showInfo={false} />
      <Container maxW="full" px={[0, 4]} py={4} borderBottom={"1px solid"} borderColor="grey.400">
        <Container maxW="container.xl">
          <Flex alignItems="center" px={[0, 4]}>
            <Link href="/" aria-label="Retour à la page d'accueil">
              <Flex direction="row" align="center" px={[0, 4]}>
                <Image src="/images/marianne.svg" aria-hidden={true} alt="" width="108" height="90" />
                <LbaNew w="143px" h="37px" />
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
                <MenuButton as={Button} variant="pill" data-testid="logged-button">
                  <Flex alignItems="center">
                    <Icon width="32px" height="32px" as={RiAccountCircleLine} color="bluefrance.500" />
                    <Box display={["none", "none", "block"]} ml={2}>
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
                      <MenuItem onClick={() => router.push("/espace-pro/admin/eligible-trainings-for-appointment/search")}>Rendez-vous Apprentissage</MenuItem>
                      <MenuItem onClick={() => router.push("/espace-pro/administration/gestionEntreprises")}>Entreprises de l'algorithme</MenuItem>
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
