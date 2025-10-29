import React from "react";
import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText(/Admin Event/i)).toBeInTheDocument();
  // Label updated in UI to "The Residents:" with a drink emoji
  expect(screen.getByText(/The Residents:/i)).toBeInTheDocument();
    expect(screen.getByText(/Mitsu/i)).toBeInTheDocument();
    expect(screen.getByText(/Zine/i)).toBeInTheDocument();
  });
});
