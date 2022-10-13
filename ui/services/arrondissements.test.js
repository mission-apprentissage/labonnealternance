import { simplifiedArrondissements, simplifiedItems } from './arrondissements';

describe('arrondissements', () => {
  
  it('.simplifiedArrondissements : Simplifies the first item', async () => {
    let testedItems = getTownItems('nantes')
    expect(testedItems[0].label).not.toEqual('nantes');
    let res = simplifiedArrondissements(testedItems, 'nantes')
    expect(testedItems).toEqual(testedItems);
    expect(res[0].label).toEqual('nantes');
  });
  
  it('.simplifiedItems : Do not change anything outsite Paris, Lyon, Marseille', async () => {
    let testedItems = getTownItems('nantes')
    expect(testedItems[0].label).not.toEqual('nantes');
    let res = simplifiedItems(testedItems, 'nantes')
    expect(testedItems).toEqual(testedItems);
    expect(res).toEqual(testedItems);
  });
  
  it('.simplifiedItems : Change first item for Paris', async () => {
    let testedItems = getTownItems('Paris')
    expect(testedItems[0].label).not.toEqual('Paris');
    let res = simplifiedItems(testedItems, 'Paris')
    expect(testedItems).toEqual(testedItems);
    expect(res[0].label).toEqual('Paris');
  });

  it('.simplifiedItems : Change first item for Lyon', async () => {
    let testedItems = getTownItems('Lyon')
    expect(testedItems[0].label).not.toEqual('Lyon');
    let res = simplifiedItems(testedItems, 'Lyon')
    expect(testedItems).toEqual(testedItems);
    expect(res[0].label).toEqual('Lyon');
  });

  it('.simplifiedItems : Change first item for Marseille', async () => {
    let testedItems = getTownItems('Marseille')
    expect(testedItems[0].label).not.toEqual('Marseille');
    let res = simplifiedItems(testedItems, 'Marseille')
    expect(testedItems).toEqual(testedItems);
    expect(res[0].label).toEqual('Marseille');
  });

  let getTownItems = function (townName) {
    return [
      {
        "value": {
          "type": "Point",
          "coordinates": [
            2.347,
            48.859
          ]
        },
        "insee": "75056",
        "zipcode": "75001",
        "label": `${townName} 75001`
      },
      {
        "value": {
          "type": "Point",
          "coordinates": [
            2.295289,
            48.841959
          ]
        },
        "insee": "75115",
        "zipcode": "75015",
        "label": `${townName} 15e Arrondissement 75015`
      }
    ]
  }

});
