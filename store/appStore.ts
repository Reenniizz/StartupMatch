"use client";

import { create } from "zustand";

interface AppState {
  selectedSkills: string[];
  formProgress: number;
  isMenuOpen: boolean;
  currentSection: string;
  setSelectedSkills: (skills: string[]) => void;
  setFormProgress: (progress: number) => void;
  setMenuOpen: (open: boolean) => void;
  setCurrentSection: (section: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedSkills: [],
  formProgress: 0,
  isMenuOpen: false,
  currentSection: "home",
  setSelectedSkills: (skills) => set({ selectedSkills: skills }),
  setFormProgress: (progress) => set({ formProgress: progress }),
  setMenuOpen: (open) => set({ isMenuOpen: open }),
  setCurrentSection: (section) => set({ currentSection: section }),
}));