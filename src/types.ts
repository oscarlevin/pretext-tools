type SpellCheckScope = {
  comments: "Check" | "Ignore";
  inlineMath: "Check" | "Ignore";
  displayMath: "Check" | "Ignore";
  inlineCode: "Check" | "Ignore";
  blockCode: "Check" | "Ignore";
  latexImage: "Check" | "Ignore";
  tags: "Check" | "Ignore";
};

export { SpellCheckScope };
