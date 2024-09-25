// module
import { marked, Token, Tokens } from "marked";

const headingNames = ["", "chapter", "section", "subsection"];
const headingPrefixes = ["", "ch-", "sec-", "sub-"];
let headingStack : Tokens.Heading[] = [];

function closeHeadingsUpTo(depth: number): string {
  let result = "";
  while (headingStack.length > 0) {
    const nextHeading = headingStack.pop()!;
    if ((nextHeading.depth ?? 0) >= depth) {
      result += `</${headingNames[nextHeading.depth ?? 0]}>\n`;
    } else {
      headingStack.push(nextHeading);
      break;
    }
  }
  return result;
}

function pushHeading(token: Tokens.Heading) {
  headingStack.push(token);
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, function (c: string) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      default: return c;
      // case "'":
      //   return "&apos;";
      // case '"':
      //   return "&quot;";
    }
  });
}

function wrap(tag: string, tokens?: Token[], join?: string): string {
  const contents = (tokens ?? []).map(processToken).join(join ?? "\n");
  return `<${tag}>${join}${contents}</${tag}>`;
}

function processHeading(token: Tokens.Heading): string {
  const preamble = closeHeadingsUpTo(token.depth);
  pushHeading(token);
  const title = token.tokens.map(processToken).join("");
  return `${preamble}<${headingNames[token.depth]} xml:id="${headingPrefixes[token.depth]}...">\n<title>${title}</title>\n`;
}
function processCodeblock(token: Tokens.Code): string {
  return `<program language="${token.lang || '$'}">\n<input>\n${escapeXml(token.text)}\n</input></program>`;
}

function processToken(token: Token): string {
  switch (token.type) {
    case "space":
      return token.raw;
    case "heading":
      return processHeading(token as Tokens.Heading);
    case "code":
      return processCodeblock(token as Tokens.Code);
    case "table":
      return "TODO tables";
    case "hr":
      return "TODO hr";
    case "blockquote":
      return wrap("blockquote", token.tokens);
    case "list":
      return wrap(token.ordered ? "ol" : "ul", token.items);
    case "list_item":
      return wrap("li", token.tokens);
    case "paragraph":
      return wrap("p", token.tokens);
    case "html":
      return (token as Tokens.HTML).raw;
    case "text":
      if ("tokens" in token) {
        return token.tokens!.map(processToken).join("");
      } else {
        return escapeXml(token.text);
      }
    case "codespan":
      return `<c>${token.text}</c>`;
    case "strong":
      return wrap("term", token.tokens, "");
    case "em":
      return wrap("em", token.tokens, "");
    case "link":
    case "image":
    case "def":
    case "escape":
    case "br":
    case "del":
      return "TODO: " + token.type;
    default:
      console.log("Unknown token type: " + token.type);
      return token.raw;
  }
}

function convertMarkdown(md: string) {
  const tokens = marked.lexer(md);
  return tokens.map(processToken).join("\n") + closeHeadingsUpTo(0);
  // return JSON.stringify(tokens);
}

export function markdownToPretext(text: string) {
  console.log("Converting Markdown to PreTeXt.");
  var result = convertMarkdown(text);
  console.log("Done with conversion.");
  return result;
}
