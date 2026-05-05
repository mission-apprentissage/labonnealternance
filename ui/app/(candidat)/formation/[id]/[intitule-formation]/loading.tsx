import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { PublicHeaderStatic } from "@/app/_components/PublicHeader"
import ItemDetailLoading from "@/components/ItemDetail/ItemDetailLoading"

export default function FormationDetailLoading() {
  return (
    <>
      <PublicHeaderStatic />
      <ItemDetailLoading type={LBA_ITEM_TYPE.FORMATION} />
    </>
  )
}
