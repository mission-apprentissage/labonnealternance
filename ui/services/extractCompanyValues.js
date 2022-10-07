export default function extractCompanyValues(item_h) {
  let res = {};
  let contact_h = item_h?.contact ? { ...item_h.contact } : {};
  let company_h = item_h?.company ? { ...item_h.company } : {};
  company_h.naf = item_h.nafs && item_h.nafs.length ? item_h.nafs[0].label : "";
  company_h.address = item_h?.place?.fullAddress || "";
  company_h.job_title = item_h?.title;
  company_h.job_id = item_h?.job?.id;
  company_h.type = item_h?.ideaType;

  res = { ...contact_h, ...company_h };

  return res;
}
