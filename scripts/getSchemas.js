// This will download the latest versions of the schemas from the pretext repository and the pretext-cli repository and put them in assets/schema.
// We can run this before every release.

import fs from "fs";
import path from "path";
import https from "https";
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const pretextSchemas = ["https://raw.githubusercontent.com/PreTeXtBook/pretext-cli/refs/heads/main/schema/project-ptx.rng", "https://raw.githubusercontent.com/PreTeXtBook/pretext/refs/heads/master/schema/publication-schema.rng", "https://raw.githubusercontent.com/PreTeXtBook/pretext-cli/refs/heads/main/schema/project-ptx.rng", "https://raw.githubusercontent.com/PreTeXtBook/pretext/refs/heads/master/schema/pretext-dev.rng"];

for (let schema of pretextSchemas) {
  const filename = path.basename(schema);
  const file = fs.createWriteStream(path.join(__dirname, "../extension/assets/schema", filename));
  https.get(schema, function (response) {
    response.pipe(file);
  });
}