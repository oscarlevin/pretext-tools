// This will download the latest versions of the schemas from the pretext repository and the pretext-cli repository and put them in assets/schema.
// We can run this before every release.

const fs = require('fs');
const path = require('path');
const https = require('https');

const pretextSchemas = ["https://raw.githubusercontent.com/PreTeXtBook/pretext-cli/refs/heads/main/schema/project-ptx.rng", "https://raw.githubusercontent.com/PreTeXtBook/pretext/refs/heads/master/schema/pretext.rng", "https://raw.githubusercontent.com/PreTeXtBook/pretext/refs/heads/master/schema/pretext-dev.rng"];

for (let schema of pretextSchemas) {
  const filename = path.basename(schema);
  const file = fs.createWriteStream(path.join(__dirname, "../assets/schema", filename));
  https.get(schema, function(response) {
    response.pipe(file);
  });
}