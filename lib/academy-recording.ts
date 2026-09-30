const recordingExtensions: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
};

export function getAcademyRecordingFormat(mimeType: string) {
  const contentType = mimeType.split(";", 1)[0].trim().toLowerCase();
  const extension = recordingExtensions[contentType];
  return extension ? { contentType, extension } : null;
}
