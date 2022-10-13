import toggleCandidature from "./toggleCandidature.js";

describe("toggleCandidature", () => {

  it("By default, set the sending state do default, and reverse modal value", () => {
    // given
    const setSendingState = jest.fn();
    const setModal = jest.fn();
    const modal = false
    // when
    toggleCandidature({modal, setSendingState, setModal})
    // then
    expect(setSendingState).toHaveBeenCalledWith("not_sent");
    expect(setModal).toHaveBeenCalledWith(true);
  });
  
  it("When modal is activated...", () => {
    // given
    const setSendingState = jest.fn();
    const setModal = jest.fn();
    const modal = true
    // when
    toggleCandidature({modal, setSendingState, setModal})
    // then
    expect(setSendingState).not.toHaveBeenCalled();
    expect(setModal).toHaveBeenCalledWith(false);
  });
  

});
