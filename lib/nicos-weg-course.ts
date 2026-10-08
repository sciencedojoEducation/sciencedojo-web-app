export function isNicosWegCourse(key: string | undefined): boolean {
  return !!key && ["deutsch-nicos-weg-a1", "deutsch-nicos-weg-a2", "deutsch-nicos-weg-b1"].includes(key);
}
