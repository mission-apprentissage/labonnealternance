import { Box, Link, Flex, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/context/UserContext"
import { apiGet } from "@/utils/api.utils"

import { UserLogo } from "../../../theme/components/icons"
import Layout from "../common/components/Layout"

const LayoutAdminRdvA = (props) => {
  const { user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await apiGet("/auth/logout", {})
    router.push("/")
  }

  return (
    <Layout>
      <Box bg="#FAFAFA">
        <Flex p={4} bg="white" borderBottom="1px solid #EBEBEB">
          <Box ml={[0, 0, 0, 16]} flex={["none", "none", "1", "1"]}></Box>
          <Flex mx={[0, 0, 0, 40]} ml={[4, 4, 0, 0]}>
            {user && (
              <Box>
                <Menu isLazy>
                  <MenuButton>Menu</MenuButton>
                  <MenuList>
                    <Link href="/espace-pro/admin/eligible-trainings-for-appointment/search">
                      <MenuItem>Rechercher / modifier un siret formateur</MenuItem>
                    </Link>
                  </MenuList>
                </Menu>
              </Box>
            )}
            <Box flex={["none", "1", "1", "1"]} ml={[0, 10, 10, 10]}>
              <Menu>
                <MenuButton>
                  <UserLogo ml={[4, 4, 0, 0]} />
                  {user && <>{user.email}</>}
                </MenuButton>
                <MenuList>
                  {/* MenuItems are not rendered unless Menu is open */}
                  <Link color="#5F6063" fontSize="13px" bg="white" fontWeight="400" onClick={handleLogout}>
                    <MenuItem>{!user ? <>Connexion</> : <>Se déconnecter</>}</MenuItem>
                  </Link>
                </MenuList>
              </Menu>
            </Box>
          </Flex>
        </Flex>
        <>{props.children}</>
      </Box>
    </Layout>
  )
}

export default LayoutAdminRdvA
