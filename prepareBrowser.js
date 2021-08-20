const fs = require('fs')

// Prepare browser-ready index.ts file from server.ts file
// https://nolanlawson.com/2017/01/09/how-to-write-a-javascript-package-for-both-node-and-the-browser/
fs.readFile('./server.ts', 'utf8', function(err, data) {
  const lines = []
  let browserIgnore = false
  for (const line of data.split('\n')) {
    const shouldToggle = line.includes('@browser-ignore')
    // Don't push line if it contains @browser-ignore string
    if (shouldToggle) {

      browserIgnore = !browserIgnore
      continue
    }
    if (!browserIgnore) lines.push(line)
  }
  fs.writeFile('./index.ts', lines.join('\n'), function() {})
})
