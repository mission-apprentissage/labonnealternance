/*
job
 name: "Soins aux animaux"
 romes: ["A1501", "A1502", "A1407", "A1503", "A1504"]
 slug: "soins-aux-animaux"
*/

/*
town
  insee: "21231"
  lat: "47.3167"
  lon: "5.01667"
  name: "Dijon"
  slug: "dijon"
  zip: "21000"
*/

/*
 /recherche-apprentissage?
    &display=list
    &job_name=Soins%20aux%20animaux
    &romes=A1501,A1502
    &radius=30
    &lat=47.331938
    &lon=5.034852
    &zipcode=21000
    &insee=21231
    &address=Dijon
*/

export const buildLinkForTownAndJob = (town, job) => {
  let result = '/recherche-apprentissage?&display=list';

  result += '&job_name=' + encodeURIComponent(job.name)
  result += '&romes=' + job.romes.join(',')
  result += '&radius=30&lat=' + town.lat + '&lon=' + town.lon
  result += '&zipcode=' + town.zip
  result += '&insee=' + town.insee
  result += '&address=' + encodeURIComponent(town.name)

  return result;
};
