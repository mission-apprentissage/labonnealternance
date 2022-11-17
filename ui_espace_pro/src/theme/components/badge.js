const commonStatusBadgeStyle = {
  fontSize: "omega",
  fontWeight: 700,
  borderRadius: 20,
  pl: 4,
  pr: 4,
  py: 1,
  textTransform: "none",
}

const Badge = {
  variants: {
    inactive: {
      bg: "#FFE8E5",
      color: "#B34000",
    },
    active: {
      bg: "#B8FEC9",
      color: "#18753C",
    },
    awaiting: {
      bg: "#FEECC2",
      color: "#716043",
    },
  },
}

export { Badge }
