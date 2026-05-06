import NextImage from "next/image"

import motifHigh from "./home_form_decoration.svg"
import motifSmall from "./seo_decoration.svg"

export const HomeCircleImageDecoration = ({ size }: { size: "small" | "high" }) => (
  <NextImage
    fetchPriority="high"
    priority
    src={size === "high" ? motifHigh.src : motifSmall.src}
    alt=""
    unoptimized
    height={size === "high" ? motifHigh.height : motifSmall.height}
    width={size === "high" ? motifHigh.width : motifSmall.width}
    style={{
      width: "100%",
      height: "auto",
      objectFit: "cover",
    }}
  />
)
