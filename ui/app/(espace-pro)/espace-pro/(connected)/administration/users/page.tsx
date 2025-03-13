import UserLists from "@/app/(espace-pro)/espace-pro/(connected)/administration/users/UserLists"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function AccueilAdministration() {
  return (
    <DepotSimplifieStyling>
      <UserLists />
    </DepotSimplifieStyling>
  )
}
