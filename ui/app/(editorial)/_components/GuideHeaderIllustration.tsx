import Image from "next/image"
import header from "ui/public/images/guides/header.svg"

export const GuideHeaderIllustration = () => (
  <Image
    fetchPriority="low"
    src={header.src}
    alt=""
    unoptimized
    height={header.height}
    width={header.width}
    style={{
      overflow: "visible",
      position: "absolute",
      objectFit: "contain",
    }}
  />
)
