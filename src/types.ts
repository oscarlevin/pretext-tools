import { CompletionItem } from "vscode-languageserver";

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
  detail?: string;
  description?: string;
  sort?: string;
  retrigger?: boolean;
};

type Snippets = {
  [key: string]: Snippet;
};

type CompletionItems = {
  [key: string]: CompletionItem;
};

export { CompletionItems, SpellCheckScope, Snippet, Snippets };

// Set up types:
  export type LabelArray = [string, string, string][];
