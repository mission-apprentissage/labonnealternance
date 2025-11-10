import NextImage from "next/image"

import motifHigh from "./home_form_decoration.svg"
import motifSmall from "./seo_decoration.svg"

export const HomeCircleImageDecoration = ({ size }: { size: "small" | "high" }) => (
  <NextImage
    fetchPriority="low"
    src={size === "high" ? motifHigh.src : motifSmall.src}
    alt=""
    unoptimized
    height={size === "high" ? motifHigh.height : motifSmall.height}
    width={size === "high" ? motifHigh.width : motifSmall.width}
    style={{
      overflow: "visible",
      height: "calc(100% - 10px)",
      width: "100%",
      top: "20px",
      position: "absolute",
      objectFit: "cover",
    }}
  />
)
