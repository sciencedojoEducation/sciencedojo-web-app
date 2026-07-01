import type { FocusDojoAccessLevel } from "@/lib/focusdojo/access-levels";

export type FocusTrack = {
  id: string;
  title: string;
  src: string;
  minimumAccess: FocusDojoAccessLevel;
};

export type FocusEnvironment = {
  id: string;
  title: string;
  description: string;
  mood: string;
  minimumAccess: FocusDojoAccessLevel;
  tracks: FocusTrack[];
};

type ScienceDojoTrack = {
  title: string;
  file: string;
  minimumAccess?: FocusDojoAccessLevel;
};

function audioSrc(folder: string, file: string) {
  return `/audio/focus/${folder}/${encodeURIComponent(file)}`;
}

function tracksFor(folder: string, tracks: ScienceDojoTrack[]): FocusTrack[] {
  return tracks.map((track, index) => ({
    id: `${folder}-${index + 1}`,
    title: track.title,
    src: audioSrc(folder, track.file),
    minimumAccess: track.minimumAccess ?? "basic",
  }));
}

export const focusEnvironments: FocusEnvironment[] = [
  {
    id: "deep-focus",
    title: "Deep Focus",
    description: "Analytical concentration atmosphere",
    mood: "Best for maths, coding, and problem solving",
    minimumAccess: "free",
    tracks: tracksFor("deep-focus", [
      { title: "Glassnote Drift", file: "Glassnote Drift.mp3", minimumAccess: "free" },
      { title: "Quiet Graphite Room", file: "Quiet Graphite Room.mp3" },
    ]),
  },
  {
    id: "calm-revision",
    title: "Calm Revision",
    description: "Warm long-session revision atmosphere",
    mood: "Best for homework and evening revision",
    minimumAccess: "free",
    tracks: tracksFor("calm-revision", [
      { title: "Midnight Revision Room", file: "Midnight Revision Room.mp3", minimumAccess: "free" },
      { title: "Midnight Revision Room II", file: "Midnight Revision Room (1).mp3" },
    ]),
  },
  {
    id: "reading-atmosphere",
    title: "Reading Atmosphere",
    description: "Quiet environment for deep reading",
    mood: "Best for theory, comprehension, and essays",
    minimumAccess: "basic",
    tracks: tracksFor("reading-atmosphere", [
      { title: "Velvet Margin", file: "Velvet Margin.mp3" },
      { title: "Velvet Margin II", file: "Velvet Margin (1).mp3" },
    ]),
  },
  {
    id: "exam-calm",
    title: "Exam Calm",
    description: "Low-stimulation focus for pressure practice",
    mood: "Best for mock exams and timed practice",
    minimumAccess: "basic",
    tracks: tracksFor("exam-calm", [
      { title: "Quiet Exam Room", file: "Quiet Exam Room.mp3" },
      { title: "Quiet Exam Room II", file: "Quiet Exam Room (1).mp3" },
    ]),
  },
  {
    id: "immersive-focus",
    title: "Immersive Focus",
    description: "Grounding atmosphere for deep work",
    mood: "Best for emotional regulation and long sessions",
    minimumAccess: "basic",
    tracks: tracksFor("immersive-focus", [
      { title: "Rain Under Cedar", file: "Rain Under Cedar.mp3" },
      { title: "Rain Under Cedar II", file: "Rain Under Cedar (1).mp3" },
    ]),
  },
  {
    id: "digital-study-zone",
    title: "Digital Study Zone",
    description: "Gentle digital concentration atmosphere",
    mood: "Best for relaxed study and creative tasks",
    minimumAccess: "basic",
    tracks: tracksFor("digital-study-zone", [
      { title: "Pixel Classroom", file: "Pixel Classroom.mp3" },
      { title: "Pixel Classroom II", file: "Pixel Classroom (1).mp3" },
    ]),
  },
  {
    id: "creative-flow",
    title: "Creative Flow",
    description: "Light study atmosphere for thinking and planning",
    mood: "Best for brainstorming and lighter study",
    minimumAccess: "basic",
    tracks: tracksFor("creative-flow", [
      { title: "Bossa Study Terrace", file: "Bossa Study Terrace.mp3" },
      { title: "Bossa Study Terrace II", file: "Bossa Study Terrace (1).mp3" },
    ]),
  },
  {
    id: "reflection-space",
    title: "Reflection Space",
    description: "Calm atmosphere for reset and reflection",
    mood: "Best for late-night review and gentle focus",
    minimumAccess: "basic",
    tracks: tracksFor("reflection-space", [
      { title: "Velvet Study Room", file: "Velvet Study Room.mp3" },
      { title: "Velvet Study Room II", file: "Velvet Study Room (1).mp3" },
    ]),
  },
];
