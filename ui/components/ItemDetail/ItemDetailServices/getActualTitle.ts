export default function getActualTitle({ selectedItem, kind }) {
  let title = ""

  if (kind === "formation") {
    title = selectedItem?.title || selectedItem?.longTitle
  } else if (kind === "matcha") {
    title = selectedItem?.title
  } else if (kind === "peJob") {
    title = selectedItem?.title
  } else {
    // lba / lbb
    title = selectedItem?.nafs[0]?.label
  }

  return title
}
