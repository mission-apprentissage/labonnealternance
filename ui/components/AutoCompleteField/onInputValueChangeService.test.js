import onInputValueChangeService from "./onInputValueChangeService";

describe("onInputValueChangeService", () => {

  it("Sans appel API extérieur, la liste affichée à l'utilisateur est la liste des items, filtrée selon l'entrée initiale", async () => {
    let inputValue = "plo";
    let inputItems = [];
    let items = [{ label: "plomberie" }, { label: "agriculture" }, { label: "ploermel" }];
    let setInputItems = jest.fn();

    const res = await onInputValueChangeService({ inputValue, inputItems, items, setInputItems });

    expect(setInputItems).toHaveBeenCalledWith([{ label: "plomberie" }, { label: "ploermel" }]);
  });

  it("Sans appel API extérieur, la liste affichée à l'utilisateur est la liste des items, filtrée selon l'entrée initiale, résiste aux majuscules/minuscules", async () => {
    let inputValue = "plo";
    let inputItems = [];
    let items = [{ label: "PLomberie" }, { label: "AGriculture" }, { label: "Ploermel" }];
    let setInputItems = jest.fn();

    const res = await onInputValueChangeService({ inputValue, inputItems, items, setInputItems });

    expect(setInputItems).toHaveBeenCalledWith([{ label: "PLomberie" }, { label: "Ploermel" }]);
  });

});
