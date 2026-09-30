export type GermanA1SpeakerProfile = {
  voice: string;
  openAIVoice: string;
  systemVoice: string;
  gender: "female" | "male";
  ageGroup: "adult" | "older-adult";
  performance: string;
};

export const germanA1SpeakerProfiles: Record<string, GermanA1SpeakerProfile> = {
  Anna: {
    voice: "de-de-assistant-11",
    openAIVoice: "coral",
    systemVoice: "Anna (German (Germany))",
    gender: "female",
    ageGroup: "adult",
    performance:
      "A warm, upbeat woman in her late twenties. She is friendly, curious, and lightly playful, with a bright smile audible in her voice.",
  },
  Eddy: {
    voice: "de-de-assistant-8",
    openAIVoice: "onyx",
    systemVoice: "Eddy (German (Germany))",
    gender: "male",
    ageGroup: "adult",
    performance:
      "A friendly man in his early thirties. He sounds relaxed, encouraging, and gently energetic, never stern or theatrical.",
  },
  Sam: {
    voice: "de-de-assistant-8",
    openAIVoice: "onyx",
    systemVoice: "Eddy (German (Germany))",
    gender: "male",
    ageGroup: "adult",
    performance:
      "A friendly male language learner in his early thirties. He sounds open, curious, and slightly tentative while introducing himself, with warm natural energy.",
  },
  "Ansage eins": {
    voice: "de-de-storyteller-5",
    openAIVoice: "fable",
    systemVoice: "Grandpa (German (Germany))",
    gender: "male",
    ageGroup: "older-adult",
    performance:
      "An older German man making a calm public announcement. His delivery is authoritative but kind, measured, and easy to understand.",
  },
  Telefonnotiz: {
    voice: "de-de-concierge-2",
    openAIVoice: "marin",
    systemVoice: "Anna (German (Germany))",
    gender: "female",
    ageGroup: "adult",
    performance:
      "A professional woman in her forties leaving a concise telephone message. She sounds natural, attentive, and pleasantly businesslike.",
  },
  Gespräch: {
    voice: "de-de-assistant-9",
    openAIVoice: "cedar",
    systemVoice: "Eddy (German (Germany))",
    gender: "male",
    ageGroup: "adult",
    performance:
      "A sociable man in his forties speaking in a natural everyday conversation. He is expressive and approachable, with grounded energy.",
  },
};
