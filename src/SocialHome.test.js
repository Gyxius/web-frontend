import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SocialHome from "./SocialHome";

const adminJoinedEvents = [
  {
    name: "Admin Event",
    time: "8:00 PM",
    crew: [
      { name: "Mitsu", emoji: "🦸", country: "🇫🇷" },
      { name: "Zine", emoji: "🦸", country: "🇲🇦" }
    ]
  }
];

describe("SocialHome", () => {
  it("renders without React child errors for Admin user", () => {
    render(
      <SocialHome
        userName="Admin"
        joinedEvents={adminJoinedEvents}
        onJoinEvent={() => {}}
        onJoinedEventClick={() => {}}
        onUserClick={() => {}}
        onLeaveEvent={() => {}}
        pendingRequests={[]}
        onCancelPendingRequest={() => {}}
        showDebug={true}
      />
    );
  expect(screen.getByText(/Hi Admin/i)).toBeInTheDocument();
  // Switch to the Joined tab to see joined events
  const joinedTab = screen.getByText(/Joined/i);
  fireEvent.click(joinedTab);
    expect(screen.getByText(/Admin Event/i)).toBeInTheDocument();
    // Joined events card shows attendees summary
    expect(screen.getByText(/2 attendees/i)).toBeInTheDocument();
  });
});
