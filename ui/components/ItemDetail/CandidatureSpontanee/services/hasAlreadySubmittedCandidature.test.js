import hasAlreadySubmittedCandidature from "./hasAlreadySubmittedCandidature";

describe("hasAlreadySubmittedCandidature", () => {

  it("No if applied is null and modal is closed (modal=false)", async () => {
    // given
    let input = { applied: null, modal: false }
    // when
    let output = hasAlreadySubmittedCandidature(input)
    // then
    expect(output).toEqual(false)
  });

  it("No if applied is 'null' and modal is closed (modal=false)", async () => {
    // given
    let input = { applied: 'null', modal: false }
    // when
    let output = hasAlreadySubmittedCandidature(input)
    // then
    expect(output).toEqual(false)
  });

  it("Yes if applied is any Number like '1234' and modal is closed (modal=false)", async () => {
    // given
    let input = { applied: '1234', modal: false }
    // when
    let output = hasAlreadySubmittedCandidature(input)
    // then
    expect(output).toEqual(true)
  });

  it("No if applied is any Number like '1234' and modal still open (modal=true)", async () => {
    // given
    let input = { applied: '1234', modal: true }
    // when
    let output = hasAlreadySubmittedCandidature(input)
    // then
    expect(output).toEqual(false)
  });

});
