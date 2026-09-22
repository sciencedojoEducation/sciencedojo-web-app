"use client";

import { produce } from "immer";
import { create } from "zustand";
import type { AcademyCourse } from "@/lib/tutor-academy";

export type AcademySaveState =
  | "saved"
  | "dirty"
  | "saving"
  | "offline"
  | "conflict"
  | "error";

type HistoryEntry = { label: string; document: AcademyCourse };

type AcademyEditorState = {
  document: AcademyCourse | null;
  revision: number;
  selectedLessonId: string | null;
  selectedBlockId: string | null;
  inspectorTab: "content" | "design" | "accessibility" | "logic";
  saveState: AcademySaveState;
  savedAt: string | null;
  message: string;
  past: HistoryEntry[];
  future: HistoryEntry[];
  lastCommand: string;
  lastCommandAt: number;
  initialize: (document: AcademyCourse, revision: number) => void;
  command: (label: string, recipe: (document: AcademyCourse) => void) => void;
  selectLesson: (id: string) => void;
  selectBlock: (lessonId: string, blockId: string) => void;
  setInspectorTab: (tab: AcademyEditorState["inspectorTab"]) => void;
  setSaveState: (state: AcademySaveState, message?: string) => void;
  markSaved: (revision: number, savedAt: string) => void;
  undo: () => void;
  redo: () => void;
};

const clone = (document: AcademyCourse) => structuredClone(document);

export const useAcademyEditorStore = create<AcademyEditorState>((set, get) => ({
  document: null,
  revision: 1,
  selectedLessonId: null,
  selectedBlockId: null,
  inspectorTab: "content",
  saveState: "saved",
  savedAt: null,
  message: "",
  past: [],
  future: [],
  lastCommand: "",
  lastCommandAt: 0,
  initialize: (document, revision) =>
    set({
      document: clone(document),
      revision,
      selectedLessonId: document.lessons[0]?.id || null,
      selectedBlockId: null,
      saveState: "saved",
      past: [],
      future: [],
      message: "",
      lastCommand: "",
      lastCommandAt: 0,
    }),
  command: (label, recipe) => {
    const state = get();
    if (!state.document) return;
    const now = Date.now();
    const groupWithPrevious =
      state.lastCommand === label && now - state.lastCommandAt < 800;
    // Consecutive keystrokes are one undoable command. Avoid cloning the full
    // course for every character once the history checkpoint already exists.
    const previous = groupWithPrevious ? null : clone(state.document);
    const document = produce(state.document, recipe);
    set({
      document,
      past: groupWithPrevious
        ? state.past
        : [
            ...state.past.slice(-49),
            { label, document: previous || clone(state.document) },
          ],
      future: [],
      saveState: "dirty",
      message: "",
      lastCommand: label,
      lastCommandAt: now,
    });
  },
  selectLesson: (id) => set({ selectedLessonId: id, selectedBlockId: null }),
  selectBlock: (lessonId, blockId) =>
    set({
      selectedLessonId: lessonId,
      selectedBlockId: blockId,
      inspectorTab: "content",
    }),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  setSaveState: (saveState, message = "") => set({ saveState, message }),
  markSaved: (revision, savedAt) =>
    set({
      revision,
      savedAt,
      saveState: "saved",
      message: "",
      lastCommand: "",
      lastCommandAt: 0,
    }),
  undo: () => {
    const state = get();
    const entry = state.past.at(-1);
    if (!entry || !state.document) return;
    set({
      document: clone(entry.document),
      past: state.past.slice(0, -1),
      future: [
        { label: entry.label, document: clone(state.document) },
        ...state.future,
      ].slice(0, 50),
      saveState: "dirty",
      lastCommand: "",
      lastCommandAt: 0,
    });
  },
  redo: () => {
    const state = get();
    const entry = state.future[0];
    if (!entry || !state.document) return;
    set({
      document: clone(entry.document),
      past: [
        ...state.past,
        { label: entry.label, document: clone(state.document) },
      ].slice(-50),
      future: state.future.slice(1),
      saveState: "dirty",
      lastCommand: "",
      lastCommandAt: 0,
    });
  },
}));
