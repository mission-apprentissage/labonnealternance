import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import ItemDetailLoading from "@/components/ItemDetail/ItemDetailLoading"

export default function JobDetailLoading() {
  return <ItemDetailLoading type={LBA_ITEM_TYPE.FORMATION} />
}
