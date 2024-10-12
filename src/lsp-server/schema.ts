import path from "path";
import fs from "fs";
import { fromXml } from "xast-util-from-xml";
import { CONTINUE, SKIP, visit } from "unist-util-visit";
import deepmerge from "deepmerge";
import { remove } from "unist-util-remove";

type SchemaGroup = {
  [key: string]: {
    elements: string[];
    attributes: string[];
    refs?: string[];
  };
};

//Create a class for a pretext schema:
export class Schema {
  elementChildren: SchemaGroup;
  schema: any;
  constructor(schemaAst: any) {
    let tmpElementChildren: SchemaGroup = {};
    let aliasMap: SchemaGroup = {};
    remove(schemaAst, { type: "text" });
    this.schema = schemaAst;
    console.time("visit");
    visit(schemaAst, (node) => {
      if (node.type === "root") {
        return CONTINUE;
      }
      if (node.type !== "element") {
        return SKIP;
      }
      if (node.type === "element") {
        if (node.name === "start") {
          return SKIP;
        }
        if (node.name === "define") {
          let nodeName = node.attributes?.name;
          if (nodeName) {
            aliasMap[nodeName] = deepmerge(
              aliasMap[nodeName] || {},
              getChildren(node)
            );
          }
        } else if (node.name === "element") {
          let nodeName = node.attributes?.name;
          if (nodeName) {
            tmpElementChildren[nodeName] = deepmerge(
              tmpElementChildren[nodeName] || {},
              getChildren(node)
            );
          }
        } 
      }
    });
    console.timeEnd("visit");
    console.time("resolve");
    this.elementChildren = resolveRefs(tmpElementChildren, aliasMap);
    console.timeEnd("resolve");
  }
  getSchema() {
    return this.schema;
  }
}

function getChildren(elemNode: any) {
  if (
    elemNode.type !== "element" ||
    !elemNode.children ||
    elemNode.children.length === 0
  ) {
    return {};
  }
  let elements: string[] = [];
  let attributes: string[] = [];
  let refs: string[] = [];
  visit(elemNode, (node, index, parent) => {
    if (!parent) {
      return CONTINUE;
    }
    if (node.name === "element") {
      if (node.attributes && node.attributes.name) {
        elements.push(node.attributes.name);
        return SKIP;
      }
    } else if (node.name === "attribute") {
      if (node.attributes && node.attributes.name) {
        attributes.push(node.attributes.name);
        return SKIP;
      }
    } else if (node.name === "ref") {
      if (node.attributes && node.attributes.name) {
        refs.push(node.attributes.name);
        return SKIP;
      }
    }
  });
  return { elements: elements, attributes: attributes, refs: refs };
}

function resolveRefs(elements: SchemaGroup, aliases: SchemaGroup) {
  let resolvedElements: SchemaGroup = {};
  for (let elem in elements) {
    let resolvedElement = { ...elements[elem] };
    if (resolvedElement.refs) {
      while (resolvedElement.refs.length > 0) {
        let ref = resolvedElement.refs.pop();
        if (ref && aliases[ref]) {
          resolvedElement.elements.push(...aliases[ref].elements);
          resolvedElement.attributes.push(...aliases[ref].attributes);
          if (aliases[ref].refs) {
            resolvedElement.refs.push(...aliases[ref].refs);
          }
        }
      }
      resolvedElement.elements = [...new Set(resolvedElement.elements)];
      resolvedElement.attributes = [...new Set(resolvedElement.attributes)];
      resolvedElement.refs = undefined;
      resolvedElements[elem] = resolvedElement;
    }
  }
  return resolvedElements;
}

export function getAst(path: string) {
  let rngFile = fs.readFileSync(path, "utf8");
  return fromXml(rngFile);
}
