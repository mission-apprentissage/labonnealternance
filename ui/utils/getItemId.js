export const getItemId = (item) => {
  return getItemIdAndType(item).itemId;
};

export const getItemIdAndType = (item) => {
  let itemId = item.id;
  let type = "training";

  if (item.ideaType !== "formation") {
    type = item.ideaType;
  }

  if (!item.directId) {
    if (item.ideaType === "peJob") {
      itemId = item.job.id;
    } else if (item.ideaType === "matcha") {
      itemId = item.job.id;
    } else if (item.ideaType !== "formation") {
      itemId = item?.company?.siret || "siret";
    }
  }

  return { itemId, type };
};

export const getItemQueryParameters = (item) => {
  const idAndType = getItemIdAndType(item);
  return `type=${idAndType.type}&itemId=${encodeURIComponent(idAndType.itemId)}`;
};
