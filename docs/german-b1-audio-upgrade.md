# B1 natural speech replacement

The original 24 recordings use fixed-rate macOS voices and uniformly inserted dialogue pauses. The replacement generator uses Gemini 3.8 Flash TTS with Kore and Puck, native Standard German instructions, and whole-dialogue generation. Listening scripts and questions remain unchanged.

Generation requires a Gemini key in .env.local; --key-env selects the explicitly requested variable without automatic key rotation. Run:

```
node --experimental-strip-types scripts/generate-german-b1-audio.mjs --key-env=GEMINI_API_KEY4
```

Only one configured key is used. Minute limits receive bounded backoff; daily exhaustion stops the run. Matching completed files are reused. Raw generated audio is cached under tmp/b1-neural-audio before encoding, allowing an encoding retry without another API request. Lossless 24 kHz mono PCM is stored in M4A because the local afconvert installation did not accept AAC output.

After generation, run scripts/audit-german-b1-audio.mjs with Node's --experimental-strip-types flag. This sends generated recordings to Gemini for independent transcription. Review every expected/actual pair, especially numbers, times, negatives and corrections. A transcript check does not establish subjective voice quality; listen to representative narration and dialogue before publishing. Draft replacements can be saved for review with this verification outstanding.

Preview scripts/replace-german-b1-audio.mjs, then apply with --apply and the fresh --expect-draft-sha256 value from that preview. It verifies original transcripts, uploads immutable content-addressed audio, verifies downloaded hashes, snapshots the draft, and updates draft audio URLs with a revision guard. Published content, assessments and progress identities are preserved. Switch source course URLs to b1AudioUrl only after all 24 verified replacement files exist.

Current status: GEMINI_API_KEY4 completed the final discussion, bringing the total to 24 recordings. All saved files pass metadata SHA-256 integrity checks, and all source audio references now use the versioned replacement files. Ten B1 curriculum/transcript tests and focused lint passed. Independent transcription is still unavailable because Gemini 3.8 Flash returns high-demand errors, including through its current Interactions API with bounded retries. All 24 immutable uploaded files were downloaded and matched against local SHA-256 hashes. The 46 draft audio references were saved as revision 7 with a rollback snapshot; whole-draft readback matched the intended change. The published version was preserved. Automated transcript and subjective listening review remain outstanding before publication.
