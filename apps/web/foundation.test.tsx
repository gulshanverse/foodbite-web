import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./app/page";

describe("FoodBite landing page", () => {
  it("communicates the product promise", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /Good Food/i })).toBeInTheDocument();
    expect(screen.getAllByText(/eligible surplus food/i).length).toBeGreaterThan(0);
  });
});
