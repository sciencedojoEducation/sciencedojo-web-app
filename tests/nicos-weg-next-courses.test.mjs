import assert from "node:assert/strict";
import { test } from "node:test";
import { nicosWegA2Course } from "../lib/nicos-weg-a2-course.ts";
import { nicosWegB1Course } from "../lib/nicos-weg-b1-course.ts";
import { nicosWegA2Episodes } from "../lib/nicos-weg-a2-episodes.ts";
import { nicosWegB1Episodes } from "../lib/nicos-weg-b1-episodes.ts";
import { validateAcademyCourse } from "../lib/academy-course-validation.ts";
import { isAcademyDwVideoUrl } from "../lib/academy-video.ts";
import { academyFeedbackCapabilities } from "../lib/academy-feedback-capabilities.ts";
import { getNicosWritingCheck } from "../lib/nicos-weg-a1-answer-bank.ts";
import { checkPracticeAnswer } from "../lib/academy-answer-checker.ts";

for (const [level, course, episodes] of [["A2",nicosWegA2Course,nicosWegA2Episodes],["B1",nicosWegB1Course,nicosWegB1Episodes]]) {
  test(`${level}: all official episodes are ordered, playable and uniquely identified`, () => {
    assert.deepEqual(validateAcademyCourse(course).errors, []);
    assert.equal(course.lessons.length,96);
    assert.equal(new Set(course.lessons.map(l => l.id)).size,96);
    assert.equal(new Set(course.lessons.map(l => l.slug)).size,96);
    assert.equal(new Set(episodes.map(e => e.video)).size,76);
    episodes.forEach((episode,index) => {
      assert.equal(episode.episode,index+1);
      assert.equal(episode.unit,Math.floor(index/4));
      assert.equal(episode.part,index%4+1);
      const lesson=course.lessons[index];
      const video=lesson.blocks.find(b => b.type === "video");
      assert.equal(video.url,episode.video);
      assert.ok(isAcademyDwVideoUrl(video.url));
      assert.ok(episode.duration>=20,`Incomplete video: ${episode.title}`);
      assert.match(episode.video,new RegExp(`${level}[_-]E0?${episode.unit}[_-]L${episode.part}[_-]F(?:olge-0?)?${episode.episode}[_.,-]`));
      assert.ok(video.transcript.includes(episode.quote));
      assert.ok(episode.vocabulary.length>=2);
      assert.ok(lesson.blocks.some(b => b.type === "speaking-practice"));
      assert.ok(lesson.blocks.find(b => b.type === "resources").items.some(r => r.url===`${episode.url}/lv`));
    });
  });
  test(`${level}: repairs have local bilingual checks; open tasks are self-reviewed`, () => {
    assert.deepEqual(academyFeedbackCapabilities(course.key),{instantAnswers:true,guidedSelfReview:true,aiFeedback:false});
    const repairs=course.lessons.flatMap(l => l.blocks).filter(b => b.id.endsWith("-repair"));
    assert.equal(repairs.length,19);
    for (const block of repairs) {
      const spec=getNicosWritingCheck(course.key,block);
      assert.ok(spec);
      assert.match(spec.explanationSinhala,/[\u0D80-\u0DFF]/);
      assert.equal(checkPracticeAnswer(spec,block.modelAnswer).status,"correct");
      assert.equal(checkPracticeAnswer(spec,block.prompt.replace("Correct this sentence: ","")).status,"not-matched");
      assert.equal(getNicosWritingCheck(course.key,{...block,modelAnswer:"Teacher-edited answer"}),null);
    }
    const open=course.lessons[0].blocks.find(b => b.id.endsWith("-write"));
    assert.equal(getNicosWritingCheck(course.key,open),null);
  });
}

test("A2 and B1 cannot share progress identifiers or accept each other's repair answers", () => {
  const aIds=new Set(nicosWegA2Course.lessons.map(l => l.id));
  assert.ok(nicosWegB1Course.lessons.every(l => !aIds.has(l.id)));
  const aRepair=nicosWegA2Course.lessons.flatMap(l => l.blocks).find(b => b.id.endsWith("-repair"));
  assert.equal(getNicosWritingCheck(nicosWegB1Course.key,aRepair),null);
});
