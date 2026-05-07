import Image from "next/image"
import header from "@/public/images/guides/header.svg"

export const GuideHeaderIllustration = () => (
  <Image
    fetchPriority="high"
    priority
    src={header.src}
    alt=""
    unoptimized
    height={header.height}
    width={header.width}
    style={{
      maxWidth: "100%",
      height: "auto",
      objectFit: "contain",
    }}
  />
)
