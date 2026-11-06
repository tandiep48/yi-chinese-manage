// lib/lessons/typingGlow.ts
// Per-character colouring for the typing self-checks, shared by every typed step of
// the lesson milestone so they all indicate a wrong character the same way the lesson
// trainer's typing task (milestone 6) does.
//
// Given the target characters and what the learner has typed so far, it returns one
// class per target character: "char-correct" / "char-wrong" for a judged character, or
// "" for one that is not judged yet (nothing typed there, or the typed slot is still an
// IME/pinyin composition rather than a settled character). '、' separators in the target
// consume no input, matching the lesson trainer.
//
// A "judged" typed slot is a committed Chinese character or a digit (ASCII 0-9 or the
// full-width ０-９ forms): both land in the field directly, so there is no composing
// stage to wait through. Latin letters stay unjudged — they are usually mid-composition
// pinyin that has not yet resolved to a character.

const JUDGE_RE = /[一-鿿0-9０-９]/;

export function typingCharClasses(target: string[], value: string): string[] {
  const typed = [...value];
  const classes: string[] = [];
  let ti = 0;
  for (let i = 0; i < target.length; i++) {
    if (target[i] === "、") {
      classes.push("");
      continue;
    }
    let cls = "";
    if (ti < typed.length && JUDGE_RE.test(typed[ti])) {
      cls = typed[ti] === target[i] ? "char-correct" : "char-wrong";
    }
    classes.push(cls);
    ti++;
  }
  return classes;
}
