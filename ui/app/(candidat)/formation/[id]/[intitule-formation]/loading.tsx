import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { WidgetAwareHeader } from "@/app/_components/WidgetAwareHeader"
import ItemDetailLoading from "@/components/ItemDetail/ItemDetailLoading"

export default function FormationDetailLoading() {
  return (
    <>
      <WidgetAwareHeader />
      <ItemDetailLoading type={LBA_ITEM_TYPE.FORMATION} />
    </>
  )
}
