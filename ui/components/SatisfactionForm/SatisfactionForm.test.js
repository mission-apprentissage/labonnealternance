import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import SatisfactionForm from "./SatisfactionForm";
import nock from "nock";
import userEvent from "@testing-library/user-event";

describe("SatisfactionForm", () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  it("By default displays a form", () => {
    // Given
    render(<SatisfactionForm formType="avis" />);
    // When
    const submitButton = screen.queryByRole("button", { name: /envoyer-le-message/i });

    // Then
    const field = screen.getByTestId("fieldset-message");
    expect(field).toBeVisible();
    expect(field).not.toHaveClass("is-valid-false");
    expect(submitButton).toBeVisible();
  });

  it("Shows error if comment is not filled", async () => {
    // Given
    render(<SatisfactionForm formType="avis" />);
    const submitButton = screen.queryByRole("button", { name: /envoyer-le-message/i });
    // When
    userEvent.click(submitButton);

    // Then
    await waitFor(() => {
      const field = screen.getByTestId("fieldset-message");
      expect(field).toBeVisible();
      expect(field).toHaveClass("is-valid-false");
    });
  });

  it("Show successful page if comment is submitted properly", async () => {
    // Given
    render(<SatisfactionForm formType="avis" />);
    const commentArea = screen.getByTestId("comment");
    const phoneArea = screen.getByTestId("phone");
    const emailArea = screen.getByTestId("email");
    const submitButton = screen.queryByRole("button", { name: /envoyer-le-message/i });
    // When
    userEvent.type(commentArea, "My comment");
    userEvent.type(phoneArea, "0202020202");
    userEvent.type(emailArea, "a@b.c");
    expect(commentArea).toHaveValue("My comment");
    expect(phoneArea).toHaveValue("0202020202");
    expect(emailArea).toHaveValue("a@b.c");
    userEvent.click(submitButton);

    // When 2.
    nock("http://localhost:5000").post("/api/application/feedbackComment").reply(200);

    // // Then
    await waitFor(() => {
      // expect(commentArea).not.toBeVisible();
      expect(screen.getByTestId("SatisfactionFormSuccess")).toBeVisible();
    });
  });
});
