const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Specify the path to the text file
const filePath = path.join(__dirname, 'pretext.rng');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  xml2js.parseString(data, (err, result) => {
    if (err) {
      console.error('Error parsing the file:', err);
      return;
    }

    //console.log(JSON.stringify(result, null, 2));
  });

  console.log(data);

});