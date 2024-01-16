// Purpose: Contains constants used throughout the project.
// list of pretext commands
export const ptxCommandList = [
  {
    label: "Build default target",
    description: "",
    command: "pretext-tools.buildLast",
  },
  {
    label: "Build another target...",
    description: "select target",
    command: "pretext-tools.buildAny",
  },
  {
    label: "Preview file with CodeChat",
    description: "show in CodeChat preview",
    command: "pretext-tools.viewCodeChat",
  },
  {
    label: "View full document",
    description: "select target to view",
    command: "pretext-tools.viewCLI",
  },
  {
    label: "Deploy",
    description: "to GitHub Pages",
    command: "pretext-tools.deploy",
  },
  {
    label: "Refresh targets",
    description: "Refresh the list of targets",
    command: "pretext-tools.refreshTargets",
  },
  {
    label: "Convert to PreTeXt",
    description: "Convert from other formats using Pandoc",
    command: "pretext-tools.convert",
  },
  {
    label: "Run commands in terminal",
    description: "Use to debug a failed command",
    command: "pretext-tools.selectPretextCommand",
  },
];

// dictionary of pretext equivalents to latex environments
export const tex2ptxBlocks: { [key: string]: string } = {
  axiom: "axiom",
  principle: "principle",
  conjecture: "conjecture",
  heuristic: "heuristic",
  hypothesis: "hypothesis",
  assumption: "assumption",
  theorem: "theorem",
  thm: "theorem",
  lemma: "lemma",
  lem: "lemma",
  corollary: "corollary",
  cor: "corollary",
  claim: "claim",
  proposition: "proposition",
  prop: "proposition",
  algorithm: "algorithm",
  fact: "fact",
  identity: "identity",
  proof: "proof",
  definition: "definition",
  def: "definition",
  defn: "definition",
  remark: "remark",
  note: "note",
  warning: "warning",
  convention: "convention",
  observation: "observation",
  insight: "insight",
  example: "example",
  question: "question",
  problem: "problem",
  solution: "solution",
  hint: "hint",
  answer: "answer",
  exercise: "exercise",
  aside: "aside",
  activity: "activity",
  project: "project",
  investigation: "investigation",
  exploration: "exploration",
  figure: "figure",
  table: "table",
  enumerate: "ol",
  itemize: "ul",
};

////////////////////////////////////////////////////////////////
// Definitions of pretext elements and how they can be nested.//
////////////////////////////////////////////////////////////////

type PtxChildren = {
  attributes: string[];
  elements: string[];
};

type PtxElement = {
  [key: string]: PtxChildren;
};

function expand(
  parents: string[],
  attributes: string[],
  elements: string[]
): PtxElement {
  let result: PtxElement = {};
  for (let parent of parents) {
    result[parent] = { attributes: attributes, elements: elements };
  }
  return result;
}

// The following constants attempt to replicate a fair amount of the schema, so we can decide what completions to show.
const gpFigure = ["figure", "table", "listing", "list"];

const gpAside = ["aside", "biographical", "historical"];

const gpRemark = [
  "remark",
  "convention",
  "note",
  "observation",
  "warning",
  "insight",
];

const gpComputation = ["computation", "technology", "data"];

const gpTheorem = [
  "theorem",
  "lemma",
  "corollary",
  "claim",
  "proposition",
  "algorithm",
  "fact",
  "identity",
];

const gpAxiom = [
  "axiom",
  "principle",
  "conjecture",
  "heuristic",
  "hypothesis",
  "assumption",
];

const gpExample = ["example", "question", "problem"];

const gpProject = [
  "exercise",
  "activity",
  "investigation",
  "exploration",
  "project",
];

const gpCharacter = [
  "nbsp",
  "ndash",
  "mdash",
  "lsq",
  "rsq",
  "rq",
  "lq",
  "langle",
  "rangle",
  "minus",
  "times",
  "solidus",
  "obelus",
  "plusminus",
  "degree",
  "prime",
  "dblprime",
  "ellipsis",
  "midpoint",
  "swungdash",
  "permille",
  "pilcrow",
  "section-mark",
  "copyleft",
  "copyright",
  "registered",
  "trademark",
  "phonomark",
  "servicemark",
  "icon",
  "kbd",
];

const gpGenerator = [
  "today",
  "timeofday",
  "tex",
  "latex",
  "xetex",
  "xelatex",
  "pretext",
  "webwork",
  "ad",
  "am",
  "bc",
  "ca",
  "eg",
  "etal",
  "etc",
  "ie",
  "nb",
  "pm",
  "ps",
  "vs",
  "viz",
  "fillin",
  "quantity",
];

const gpVerbatim = ["c", "email"];

const gpGroup = [
  "abbr",
  "acro",
  "init",
  "q",
  "sq",
  "angles",
  "dblbrackets",
  "em",
  "term",
  "alert",
  "pubtitle",
  "articletitle",
  "foreign",
  "delete",
  "insert",
  "stale",
  "tag",
  "tage",
  "attr",
  "taxon",
];

const gpMusic = [
  "doublesharp",
  "sharp",
  "natural",
  "flat",
  "doubleflat",
  "scaledeg",
  "timesignature",
  "n",
  "chord",
];

const gpMathDisplay = ["me", "men", "md", "mdn"];

const gpHasTextShort = [
  "description",
  "creator",
  "instruction",
  "minilicense",
  "role",
  "see",
  "seealso",
  "shorttitle",
  "url",
  "xref",
  "year",
  "author",
];

const textShort = [
  ...gpCharacter,
  ...gpGenerator,
  ...gpVerbatim,
  ...gpGroup,
  ...gpMusic,
  "m",
];

const textLong = [...textShort, "var", "url", "xref"];

const textParagraph = [
  ...textShort,
  ...gpMathDisplay,
  "url",
  "xref",
  "cd",
  "fn",
  "notation",
  "idx",
  "ol",
  "ul",
  "dl",
];

const blockText = [
  "p",
  "blockquote",
  "pre",
  "image",
  "image",
  "video",
  "program",
  "console",
  "tabular",
];

const blockStatement = [
  ...blockText,
  ...gpFigure,
  ...gpAside,
  "sidebyside",
  "sbsgroup",
  "sage",
];

const blockSolution = [...blockStatement, "proof"];

const exerciseBody = [
  ...blockStatement,
  "ol",
  "hint",
  "answer",
  "solution",
  "introduction",
  "conclusion",
  "task",
  "webwork",
  "response/",
  "choices",
  "blocks",
  "matches",
  "areas",
  "setup",
  "program",
];

const blockDivision = [
  ...blockStatement,
  ...gpRemark,
  ...gpComputation,
  ...gpTheorem,
  "proof",
  "definition",
  ...gpAxiom,
  ...gpExample,
  "exercise",
  ...gpProject,
  "poem",
  "assemblage",
  "list-of",
  "fragment",
  "commentary",
];

const endSections = [
  "reading-questions",
  "exercises",
  "solutions",
  "references",
  "glossary",
  "outcomes",
  "conclusion",
];

const titles = ["title", "shorttitle", "plaintitle"];

const mdTitle = ["title", "idx"];

const mdLinedTitle = [...titles, "idx"];

// Attributes
const id = ["xml:id"];

const idl = ["xml:id", "label"];

const atSidebyside = ["margins", "width", "widths", "valign", "valigns"];

// dictionary of pretext elements and their legal children
export const elementChildren: PtxElement = {
  answer: {
    attributes: id,
    elements: [...blockSolution, ...mdTitle],
  },
  block: {
    attributes: ["correct", "order", "xml:id", "ref"],
    elements: [...blockText, "choice"],
  },
  blocks: {
    attributes: ["layout", "reuse", "randomize"],
    elements: ["block"],
  },
  book: {
    attributes: id,
    elements: [
      "title",
      "subtitle",
      "frontmatter",
      "idx",
      "part",
      "chapter",
      "backmatter",
    ],
  },
  cd: {
    attributes: [],
    elements: ["cline"],
  },
  chapter: {
    attributes: id,
    elements: [
      ...blockDivision,
      ...mdLinedTitle,
      "objectives",
      "paragraphs",
      ...endSections,
      "introduction",
      "section",
    ],
  },
  choice: {
    attributes: ["correct"],
    elements: ["statement", "feedback", ...blockText],
  },
  choices: {
    attributes: ["multiple-correct", "randomize"],
    elements: ["choice"],
  },
  definition: {
    attributes: id,
    elements: [...mdTitle, "notation", "statement"],
  },
  exercise: {
    attributes: [...idl, "number", "numbered", "language", "indentation"],
    elements: [...exerciseBody, "feedback"],
  },
  exercises: {
    attributes: id,
    elements: [
      ...mdTitle,
      "introduction",
      "conclusion",
      "exercise",
      "exercisegroup",
      "subexercises",
    ],
  },
  figure: {
    attributes: ["xml:id", "landscape"],
    elements: ["image", "video", "sidebyside", "sbsgroup", "score"],
  },
  hint: {
    attributes: id,
    elements: [...blockSolution, ...mdTitle],
  },
  idx: {
    attributes: ["sortby", "start", "finish", "h", "see", "seealso"],
    elements: textShort,
  },
  introduction: {
    attributes: id,
    elements: [...mdTitle, ...blockDivision],
  },
  li: {
    attributes: id,
    elements: [...textParagraph, ...blockStatement, ...mdTitle],
  },
  match: {
    attributes: ["order"],
    elements: ["premise", "response"],
  },
  matches: {
    attributes: [],
    elements: ["match"],
  },
  ol: {
    attributes: ["cols", "marker"],
    elements: ["li"],
  },
  p: {
    attributes: id,
    elements: textParagraph,
  },
  paragraphs: {
    attributes: id,
    elements: [...blockDivision, "idx"],
  },
  part: {
    attributes: id,
    elements: ["title", "subtitle", "idx", "chapter"],
  },
  pre: {
    attributes: [],
    elements: ["cline"],
  },
  pretext: {
    attributes: [],
    elements: ["article", "book", "letter", "memo", "docinfo"],
  },
  proof: {
    attributes: id,
    elements: [...blockStatement, "case"],
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "reading-questions": {
    attributes: id,
    elements: [...mdTitle, "introduction", "exercise", "conclusion"],
  },
  section: {
    attributes: id,
    elements: [
      ...blockDivision,
      ...mdLinedTitle,
      "objectives",
      "paragraphs",
      ...endSections,
      "introduction",
      "subsection",
    ],
  },
  sidebyside: {
    attributes: atSidebyside,
    elements: [
      "figure",
      "poem",
      "tabular",
      "image",
      "video",
      "program",
      "console",
      "p",
      "pre",
      "list",
      "stack",
    ],
  },
  solution: {
    attributes: id,
    elements: [...blockSolution, ...mdTitle],
  },
  statement: {
    attributes: id,
    elements: blockStatement,
  },
  subsection: {
    attributes: id,
    elements: [
      ...blockDivision,
      ...mdLinedTitle,
      "objectives",
      "paragraphs",
      ...endSections,
      "introduction",
      "subsubsection",
    ],
  },
  subsubsection: {
    attributes: id,
    elements: [
      ...blockDivision,
      ...mdLinedTitle,
      "objectives",
      "paragraphs",
      ...endSections,
      "introduction",
    ],
  },
  task: {
    attributes: id,
    elements: [
      "statement",
      "hint",
      "answer",
      "solution",
      "introduction",
      "task",
      "conclusion",
      ...blockStatement,
      ...mdTitle,
    ],
  },
  title: {
    attributes: [],
    elements: textLong,
  },
  ul: {
    attributes: ["cols", "marker"],
    elements: ["li"],
  },
  video: {
    attributes: [
      "xml:id",
      "width",
      "margins",
      "aspect",
      "start",
      "end",
      "play-at",
      "preview",
      "source",
      "href",
      "youtube",
      "youtubeplaylist",
      "vimeo",
    ],
    elements: [],
  },
  worksheet: {
    attributes: id,
    elements: [
      ...mdTitle,
      ...blockStatement,
      "exercise",
      "page",
      "introduction",
      "conclusion",
    ],
  },
  ...expand(gpTheorem, id, [
    "creator",
    "title",
    "idx",
    ...blockStatement,
    "statement",
    "proof",
  ]),
  ...expand(gpAxiom, id, [
    "creator",
    "title",
    "idx",
    ...blockStatement,
    "statement",
  ]),
  ...expand(gpExample, id, [
    ...blockStatement,
    "statement",
    "hint",
    "answer",
    "solution",
    "introduction",
    "conclusion",
    "task",
  ]),
  ...expand(gpProject, id, [
    ...blockStatement,
    "statement",
    "hint",
    "answer",
    "solution",
    "introduction",
    "conclusion",
    "task",
    "prelude",
    "postlude",
  ]),
};

// dictionary of pretext elements and their legal attributes
export const elementAttributes: { [key: string]: string[] } = {
  solutions: ["inline", "divisional", "project", "admit"],
  cd: ["latexsep"],
  console: ["prompt", "width", "margins"],
  program: [
    "width",
    "margins",
    "language",
    "line-numbers",
    "highlight-lines",
    "interactive",
  ],
  input: ["prompt"],
  ol: ["cols", "marker"],
  ul: ["cols", "marker"],
  dl: ["width"],
  case: ["direction"],
  figure: ["landscape"],
  sidebyside: ["margins", "width", "widths", "valigns"],
  sbsgroup: ["margins", "width", "widths", "valigns"],
  image: [
    "width",
    "margins",
    "rotate",
    "archive",
    "source",
    "decorative",
    "pg-name",
  ],
  sageplot: ["variant", "aspect"],
  cell: ["halign", "bottom", "right", "colspan"],
  row: ["header", "halign", "valign", "bottom", "left"],
  col: ["right", "top", "halign", "width"],
  tabular: [
    "width",
    "margins",
    "row-headers",
    "halign",
    "valign",
    "bottom",
    "left",
    "top",
    "right",
  ],
  sage: ["doctest", "tolerance", "auto-evaluate", "language", "type"],
  score: ["musescoreuser", "musescore"],
  video: [
    "width",
    "margins",
    "aspect",
    "start",
    "end",
    "play-at",
    "preview",
    "source",
    "href",
    "youtube",
    "youtubeplaylist",
    "vimeo",
  ],
  exercise: ["number", "workspace", "label"],
  exercisegroup: ["cols"],
  poem: ["halign"],
  stanza: ["indent"],
};
