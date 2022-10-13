export let campaignParameters = {};

export const getCampaignParameters = () => {
  let cPs = campaignParameters.utm_campaign
    ? `&utm_campaign=${campaignParameters.utm_campaign}&utm_source=${campaignParameters.utm_source}&utm_medium=${campaignParameters.utm_medium}`
    : "";
  return cPs;
};
