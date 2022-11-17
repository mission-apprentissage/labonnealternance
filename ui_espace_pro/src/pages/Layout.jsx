import { useNavigate } from "react-router-dom"
import { Box, Link, Flex, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react"
import useAuth from "../common/hooks/useAuth"
import { UserLogo } from "../theme/components/icons"
import Layout from "../common/components/Layout"

const Layout2 = (props) => {
  const [auth, setAuth] = useAuth()
  const navigate = useNavigate()

  const logout = () => {
    setAuth(null)
    navigate("/login")
  }

  const subAnonymous = "anonymous"

  return (
    <Layout>
      <Box bg="#FAFAFA">
        <Flex p={4} bg="white" borderBottom="1px solid #EBEBEB">
          <Box ml={[0, 0, 0, 16]} flex={["none", "none", "1", "1"]}></Box>
          <Flex mx={[0, 0, 0, 40]} ml={[4, 4, 0, 0]}>
            {auth.sub !== subAnonymous && (
              <Box>
                <Menu isLazy>
                  <MenuButton>Paramètres</MenuButton>
                  <MenuList>
                    <Link href="/espace-pro/admin/widget-parameters">
                      <MenuItem>Liste</MenuItem>
                    </Link>
                    <Link href="/espace-pro/admin/widget-parameters/search">
                      <MenuItem>Ajouter - Via recherche</MenuItem>
                    </Link>
                    <Link href="/espace-pro/admin/widget-parameters/bulk">
                      <MenuItem>Actions groupés</MenuItem>
                    </Link>
                  </MenuList>
                </Menu>
              </Box>
            )}
            <Box flex={["none", "1", "1", "1"]} ml={[0, 10, 10, 10]}>
              <Menu>
                <MenuButton>
                  <UserLogo ml={[4, 4, 0, 0]} />
                  {auth.sub !== subAnonymous && <>{auth.sub}</>}
                </MenuButton>
                <MenuList>
                  {/* MenuItems are not rendered unless Menu is open */}
                  <Link color="#5F6063" fontSize="13px" bg="white" fontWeight="400" onClick={logout}>
                    <MenuItem>{auth.sub === subAnonymous ? <>Connexion</> : <>Se déconnecter</>}</MenuItem>
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

export default Layout2
