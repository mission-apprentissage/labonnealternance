// __tests__/index.test.jsx

import { render, screen } from "@testing-library/react";
import Home from "../pages/index";
import "@testing-library/jest-dom";

describe("Home", () => {
  it("renders a heading", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", {
      name: /Hello World !/i,
    });

    expect(heading).toBeInTheDocument();
  });
});
