// lib/lessons/typingGlow.ts
// Per-character colouring for the typing self-checks, shared by every typed step of
// the lesson milestone so they all indicate a wrong character the same way the lesson
// trainer's typing task (milestone 6) does.
//
// Given the target characters and what the learner has typed so far, it returns one
// class per target character: "char-correct" / "char-wrong" for a judged Chinese
// character, or "" for one that is not judged yet (nothing typed there, or the typed
// slot is still an IME/pinyin composition rather than a Chinese character). '、'
// separators in the target consume no input, matching the lesson trainer.

const HANZI_RE = /[一-鿿]/;

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
    if (ti < typed.length && HANZI_RE.test(typed[ti])) {
      cls = typed[ti] === target[i] ? "char-correct" : "char-wrong";
    }
    classes.push(cls);
    ti++;
  }
  return classes;
}
