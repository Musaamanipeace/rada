import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/AppShell";

describe("AppShell Component", () => {
  it("renders skip-to-content accessibility link and main landmarks", () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );

    // Skip to content link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Main content landmark
    const mainLandmark = screen.getByRole("main");
    expect(mainLandmark).toBeInTheDocument();
    expect(mainLandmark).toHaveAttribute("id", "main-content");

    // Children rendered
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("does not render Watch Ads nav link when switch is off (D23)", () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );

    expect(screen.queryByText("Watch Ads")).not.toBeInTheDocument();
  });
});
