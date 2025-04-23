// Utilities for the visual editor

const KNOWN_TAGS = [
  'section',
  'subsection',
  'introduction',
  'title',
  'p',
  'definition',
  'example',
];


/*
* Clean up incoming PreTeXt source to ensure all tags are ones that the visual editor can handle.
* Tags that are not recognized will be replaced with a placeholder, that can be rendered back to the original.
*/
export function preprocessPtx(text: string): string {
  // Remove leading and trailing whitespace
text = text.trim();

// Replace unrecognized tags with a placeholder
text = text.replace(/<([a-zA-Z0-9]+)(\s[^>\/]*)?(\/)?>/g, (match, tagName, attributes, selfClosing) => {
    if (KNOWN_TAGS.includes(tagName)) {
        return match; // Keep recognized tags as is
    }
    attributes = attributes ? attributes.trim() : '';
    if (selfClosing) {
        return `<unknown label="${tagName}" ${attributes} />`; // Wrap self-closing unrecognized tags
    }
    return `<unknown label="${tagName}" ${attributes}>`; // Wrap unrecognized tags
});
text = text.replace(/<\/([a-zA-Z0-9]+)>/g, (match, tagName) => {
    if (KNOWN_TAGS.includes(tagName)) {
        return match; // Keep recognized tags as is
    }
    return `</unknown>`; // Close the placeholder for unrecognized tags
});

  return text;
}