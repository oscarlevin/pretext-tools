type SpellCheckScope = {
  comments: "Check" | "Ignore";
  inlineMath: "Check" | "Ignore";
  displayMath: "Check" | "Ignore";
  inlineCode: "Check" | "Ignore";
  blockCode: "Check" | "Ignore";
  latexImage: "Check" | "Ignore";
  tags: "Check" | "Ignore";
};

// Types for snippets
type Snippet = {
  prefix: string;
  body: string;
  description?: string;
  sort?: string;
  retrigger?: boolean;
};

type Snippets = {
  [key: string]: Snippet;
};

export { SpellCheckScope, Snippet, Snippets };
