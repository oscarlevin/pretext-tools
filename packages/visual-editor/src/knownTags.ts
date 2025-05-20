const theoremLikeElements = [
  "theorem",
  "lemma",
  "corollary",
  "proposition",
  "claim",
  "fact",
  "proof",
];

const axiomLikeElements = [
  "assumption",
  "axiom",
  "conjecture",
  "heuristic",
  "hypothesis",
  "principle",
];

const divisions = ["introduction", "chapter", "section", "subsection"];

const exampleLikeElements = ["example", "question", "problem"];

const solutionLikeElements = ["solution", "answer", "hint"];

const listElements = ["ol", "ul", "li"];

export const KNOWN_TAGS = [
  "p",
  "m",
  "me",
  ...divisions,
  "title",
  "definition",
  "statement",
  ...theoremLikeElements,
  ...axiomLikeElements,
  ...exampleLikeElements,
  ...solutionLikeElements,
  ...listElements,
  "term",
  "em",
  "alert",
  "q",
  "c",
  "pre",
];
