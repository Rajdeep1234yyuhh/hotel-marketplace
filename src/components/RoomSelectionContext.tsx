"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type RoomSelectionValue = {
  selectedId: string;
  setSelectedId: (id: string) => void;
  chooseAndScroll: (id: string) => void;
};

const RoomSelectionContext = createContext<RoomSelectionValue | null>(null);

export function RoomSelectionProvider({
  children,
  initialId,
}: {
  children: ReactNode;
  initialId: string;
}) {
  const [selectedId, setSelectedId] = useState(initialId);

  function chooseAndScroll(id: string) {
    setSelectedId(id);
    document
      .getElementById("booking-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <RoomSelectionContext.Provider value={{ selectedId, setSelectedId, chooseAndScroll }}>
      {children}
    </RoomSelectionContext.Provider>
  );
}

export function useRoomSelection() {
  const ctx = useContext(RoomSelectionContext);
  if (!ctx) {
    throw new Error("useRoomSelection must be used within a RoomSelectionProvider");
  }
  return ctx;
}
