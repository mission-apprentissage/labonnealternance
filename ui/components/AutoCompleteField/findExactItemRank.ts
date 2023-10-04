export default function findExactItemRank({ value, items }) {
  const rank = items.findIndex((item) => value.toLowerCase() === item.label.toLowerCase())
  return rank >= 0 ? rank : 0
}
