import { nicosWegA1Episodes } from './nicos-weg-a1-episodes.ts';
import type { AcademyLesson } from './tutor-academy.ts';

// Each grammar banner uses a scene from its own four-episode DW unit.
const grammarEpisodes = [1, 7, 12, 15, 18, 21, 25, 29, 34, 37, 42, 45, 50, 53, 58, 61, 65, 70, 76] as const;
const storyEpisodes = [1, 7, 12, 15, 25, 29, 37, 42, 50, 58, 70, 76] as const;

export function nicosLessonBanner(courseKey: string, lesson: Pick<AcademyLesson, 'id' | 'blocks'>) {
  if (courseKey !== 'deutsch-nicos-weg-a1') return undefined;
  if (!lesson.id) return undefined;
  let episodeNumber: number | undefined;
  const vocabulary = /^nico-a1-vocabulary-e(\d{2})-l([1-4])$/.exec(lesson.id);
  const grammar = /^nico-a1-grammar-(\d{2})$/.exec(lesson.id);
  const story = /^nico-a1-(\d{2})$/.exec(lesson.id);
  if (vocabulary) episodeNumber = Number(vocabulary[1]) * 4 + Number(vocabulary[2]);
  else if (grammar) episodeNumber = grammarEpisodes[Number(grammar[1])];
  else if (story) episodeNumber = storyEpisodes[Number(story[1]) - 1];
  else if (lesson.id === 'nico-a1-review') episodeNumber = 76;
  const episode = nicosWegA1Episodes.find(item => item.episode === episodeNumber);
  if (!episode) return undefined;
  // Respect a teacher's selected scene in an existing story lesson.
  const image = story ? lesson.blocks.find(block => block.type === 'image' && block.id === `${lesson.id}-image`) : undefined;
  return {
    src: image?.type === 'image' ? image.src : `/images/academy/nicos-weg-a1/episodes/${String(episode.episode).padStart(2, '0')}.jpg`,
    episode: episode.episode,
    title: episode.title,
    attribution: image?.type === 'image' && !image.src.startsWith('/images/academy/nicos-weg-a1/') ? undefined : 'Film © Deutsche Welle',
  };
}
