import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { WidgetAwareHeader } from "@/app/_components/WidgetAwareHeader"
import ItemDetailLoading from "@/components/ItemDetail/ItemDetailLoading"

export default function FormationDetailLoading() {
  return (
    <>
      <WidgetAwareHeader shell="detail-formation" />
      <ItemDetailLoading type={LBA_ITEM_TYPE.FORMATION} />
    </>
  )
}
