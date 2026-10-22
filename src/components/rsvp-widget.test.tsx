import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RsvpWidget } from "./rsvp-widget";

describe("RsvpWidget", () => {
  it("disables submit until a status is chosen", () => {
    render(
      <RsvpWidget
        eventId="event-1"
        action={vi.fn()}
        initialStatus={null}
        initialCarpoolSeats={null}
        initialDeclineReason={null}
      />
    );

    expect(screen.getByRole("button", { name: /rückmeldung speichern/i })).toBeDisabled();
  });

  it("reveals the carpool-seat stepper only after choosing Dabei", async () => {
    const user = userEvent.setup();
    render(
      <RsvpWidget
        eventId="event-1"
        action={vi.fn()}
        initialStatus={null}
        initialCarpoolSeats={null}
        initialDeclineReason={null}
      />
    );

    expect(screen.queryByText("Freie Plätze im Auto")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /dabei/i }));

    expect(screen.getByText("Freie Plätze im Auto")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rückmeldung speichern/i })).toBeEnabled();
  });

  it("increments the carpool-seat count", async () => {
    const user = userEvent.setup();
    render(
      <RsvpWidget
        eventId="event-1"
        action={vi.fn()}
        initialStatus="yes"
        initialCarpoolSeats={0}
        initialDeclineReason={null}
      />
    );

    const incrementButtons = screen.getAllByRole("button").filter((btn) => btn.querySelector("svg"));
    const plusButton = incrementButtons[incrementButtons.length - 1];

    expect(screen.getByText("0")).toBeInTheDocument();
    await user.click(plusButton);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("reveals a decline-reason field only after choosing Absage", async () => {
    const user = userEvent.setup();
    render(
      <RsvpWidget
        eventId="event-1"
        action={vi.fn()}
        initialStatus={null}
        initialCarpoolSeats={null}
        initialDeclineReason={null}
      />
    );

    await user.click(screen.getByRole("button", { name: /absage/i }));
    expect(screen.getByLabelText(/grund/i)).toBeInTheDocument();
  });
});
