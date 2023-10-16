import { Heading } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { FC } from "react"
import { IUserRecruteur } from "shared"

import { Breadcrumb } from "../../common/components/Breadcrumb"
import UserValidationHistory from "../../UserValidationHistory"

import UserForm from "./UserForm"

interface Props {
  user: IUserRecruteur
  refetchUser: any
}

const UserView: FC<Props> = ({ user, refetchUser }) => {
  const router = useRouter()
  return (
    <>
      <Breadcrumb
        pages={[
          { title: "Administration", to: "/espace-pro/administration/users" },
          { title: "Gestion des administrateurs", to: "/espace-pro/admin/utilisateurs" },
          { title: `${user.first_name} ${user.last_name}` },
        ]}
      />

      <Heading as="h2" fontSize="2xl" mb={[3, 6]} mt={3}>
        Fiche utilisateur
      </Heading>

      <UserForm user={user} onDelete={() => router.push("/espace-pro/admin/utilisateurs")} onUpdate={() => refetchUser()} />

      {/* @ts-expect-error */}
      <UserValidationHistory histories={user.status} />
    </>
  )
}

export default UserView
