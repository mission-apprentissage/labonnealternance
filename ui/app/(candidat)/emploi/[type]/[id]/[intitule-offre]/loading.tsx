import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { PublicHeaderStatic } from "@/app/_components/PublicHeader"
import ItemDetailLoading from "@/components/ItemDetail/ItemDetailLoading"

export default function JobDetailLoading() {
  return (
    <>
      <PublicHeaderStatic />
      <ItemDetailLoading type={LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA} />
    </>
  )
}
