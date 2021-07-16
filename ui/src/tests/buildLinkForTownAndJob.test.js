import { buildLinkForTownAndJob } from '../../utils/buildLinkForTownAndJob'

describe('buildLinkForTownAndJob', () => {

  it('call : generate a correct relative link', async () => {
    const town = {
      insee: "21231",
      lat: "47.3167",
      lon: "5.01667",
      name: "Dijon",
      slug: "dijon",
      zip: "21000",
    }
    const job = {
      name: "Soins aux animaux",
      romes: ["A1501", "A1502", "A1407", "A1503", "A1504"],
      slug: "soins-aux-animaux",
    }
    expect(buildLinkForTownAndJob(town, job)).toEqual('/recherche-apprentissage?&display=list&job_name=Soins%20aux%20animaux&romes=A1501,A1502,A1407,A1503,A1504&radius=30&lat=47.3167&lon=5.01667&zipcode=21000&insee=21231&address=Dijon');
  });

});
