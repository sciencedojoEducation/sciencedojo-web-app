# Ankommen: German B2 story pilot

Open `/academy/deutsch-b2-story` on the development server. The preview is independent of the Academy database and requires no login. It does not replace the existing B2 course or publish a course to Supabase.

Three original episodes follow Mira, Jonas and Leyla as they negotiate the use of a shared room. Each episode includes a three-voice listening scene, collapsible transcript, three comprehension checks, eight vocabulary cards, one grammar check, writing with a model answer, timed speaking practice and a recall task. The assumed starting point is a confident B1 learner. This is a B2 practice pilot, not a complete CEFR course or certification assessment.

Writing and speaking notes are saved only in this browser's local storage. Use “Text löschen” to remove each answer, especially on a shared device. Quiz choices are temporary. Speaking timers do not record audio. Open responses use checklist-based self-review; they are not automatically graded.

## Audio

The pilot uses Google Gemini TTS recordings generated from the exact dialogue turns in `lib/german-b2-story.ts`. The model is `gemini-3.8-flash-tts`; consistent character voices are Kore for Mira, Charon for Jonas and Aoede for Leyla. Generation groups consecutive turns into requests with at most two speakers, as required by Gemini, then joins them into each complete scene. Delivery is directed as a relaxed conversation in Standard German, with character-specific expression and clear B2 pacing.

To generate replacement files, provide FFmpeg and a configured `GEMINI_API_KEY` in `.env.local`, then run:

```sh
npm run academy:german-b2:story-audio
```

Set `B2_STORY_FFMPEG` to an absolute FFmpeg executable path when it is not on PATH. `B2_STORY_GEMINI_KEY_ENV` can select another configured `GEMINI_API_KEY` variable; `B2_STORY_GEMINI_MODEL` selects a supported Gemini speech model. The generator authenticates only to Google's `generativelanguage.googleapis.com` API, sends the fictional dialogue for synthesis, and does not print API keys. No macOS speech service or Python is needed.

Use `--dry-run` to inspect the request plan without credentials or network access, and `--episode=2` to generate only one episode. Verified cached speech is reused; `--force` regenerates it. Output goes to `public/audio/german-b2-story/gemini-v1/` with provider, model, transcript and audio hashes in adjacent JSON files. Empty speech, incomplete responses and implausible speaking speeds are rejected. AAC audio is normalized for comfortable listening. These versioned URLs replace the original macOS recordings in the course, avoiding cached playback of the old voices.

## Verification

```sh
B2_STORY_FFMPEG=/absolute/path/to/ffmpeg npm run academy:german-b2:story-audio:verify
B2_STORY_FFMPEG=/absolute/path/to/ffmpeg npm run academy:german-b2:story-audio:verify -- --transcribe
node --experimental-strip-types --test tests/german-b2-story.test.mjs
npm run typecheck
```

Local verification checks hashes, decodability, duration, silence and clipping. Optional transcription verification sends the generated audio to Google Gemini 2.5 Flash without supplying the expected transcript, then compares the returned words with the source dialogue. Reports in `docs/german-b2-story-audio-verification/` bind both checks to the exact audio hash. A transcription difference above 10% requires review; smaller differences should still be inspected for content changes. Automated checks do not substitute for a learner's judgment of the voices.

Before expanding the pilot, review its language and level with a German teacher and collect learner feedback on difficulty, audio pace and story interest.
