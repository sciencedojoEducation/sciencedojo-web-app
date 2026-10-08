import confetti from 'canvas-confetti';
import {playAnswerSound} from './academy-answer-sounds';

/** A small navigation celebration, independent of grading and completion. */
export function celebrateAcademyTopic(){
  void playAnswerSound('complete');
  if(typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  try{
    void confetti({particleCount:42,spread:58,startVelocity:22,ticks:65,gravity:1.2,scalar:0.8,
      origin:{x:0.5,y:0.45},colors:['#60A5FA','#34D399','#FBBF24','#F472B6'],
      disableForReducedMotion:true,zIndex:60});
  }catch{/* Navigation still works if canvas is unavailable. */}
}
