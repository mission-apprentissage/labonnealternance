import { Heading } from "@chakra-ui/react"
import { FC } from "react"
import { IUserRecruteur } from "shared"

import { AUTHTYPE } from "@/common/contants"

import { Breadcrumb } from "../../common/components/Breadcrumb"

import InfoDetails from "./infoDetails/InfoDetails"

interface Props {
  user: IUserRecruteur
}

const UserView: FC<Props> = ({ user }) => {
  return (
    <>
      <Breadcrumb
        pages={[
          { title: "Administration", to: "/espace-pro/administration/users" },
          { title: "Gestion des administrateurs", to: "/espace-pro/admin/utilisateurs" },
          { title: `${user.first_name} ${user.last_name}` },
        ]}
      />

      <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
        Fiche utilisateur
      </Heading>

      <InfoDetails
        data={user}
        rows={{
          _id: {
            header: () => "Identifiant",
          },
          email: {
            header: () => "Email",
          },
          is_admin: {
            header: () => "Administrateur",
            cell: ({ type }) => (type === AUTHTYPE.ADMIN ? "Oui" : "Non"),
          },
        }}
      />
    </>
  )
}

export default UserView
