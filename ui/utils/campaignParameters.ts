export type ICampaignParameters = {
  utm_campaign?: string
  utm_source?: string
  utm_medium?: string
}

export const campaignParameters: ICampaignParameters = {}

export const getCampaignParameters = () => {
  const cPs = campaignParameters.utm_campaign
    ? `&utm_campaign=${campaignParameters.utm_campaign}&utm_source=${campaignParameters.utm_source}&utm_medium=${campaignParameters.utm_medium}`
    : ""
  return cPs
}
