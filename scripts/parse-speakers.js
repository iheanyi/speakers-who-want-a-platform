
'use strict'

const fs = require('fs')
const path = require('path')
const es = require('event-stream')
const slug = require('slug')
const mkdirp = require('mkdirp')

// Read the "cleaned" version of the speaker readme
fs.createReadStream('./scripts/speakers-clean.md')
  // Split at empty lines - empty lines separate the records
  .pipe(es.split(/^$/m))
  // Create an array from the text which contains the speaker's info
  .pipe(es.map(function(data, callback) {
    const lines = data.split('\n')
    const len = lines.length
    const speakerInfo = lines.splice(1, len-2)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 ? true : false)
    callback(null, speakerInfo)
  }))
  // Convert the speaker's info to an object
  .pipe(es.through(function write(data) {
    const speaker = parseSpeaker(data)
    this.emit('data', speaker)
  }))
  // Build the speaker's hugo markdown data
  .pipe(es.map(function(data, callback) {
    const obj = buildSpeaker(data)
    callback(null, JSON.stringify(obj))
  }))
  // Write the speaker's markdown content to /content/speaker
  .pipe(es.map(function(data, callback) {
    writeSpeakerFile(JSON.parse(data), () => {
      callback(null, data)
    })
  }))
  // Profit.
  .on('end', () => console.log('\nDone!\n'))


/**
 * @description Generates a speaker's markdown for consumption by hugo
 */
function buildSpeaker(data) {
  const company = data.company || ''
  const obj = { data }
  let buff = [
    '+++',
    'bio = ""',
    `company = "${company}"`,
    `date = "${new Date().toISOString()}"`,
    'location = ""',
    `name = "${data.name}"`,
    `title = "${data.name}"`,
    'subjects = []',
    `role = "${data.title}"\n`
  ]

  data.links.forEach((link, index) => {
    let urlStr = `  url = "${link.href}"`

    if (index !== data.links.length - 1) {
      urlStr += '\n'
    }

    buff = buff.concat([
      '[[social_links]]',
      `  name = "${link.text}"`,
      urlStr
    ])

  })

  buff.push('+++\n')
  obj.markdown = buff.join('\n')
  return obj

}

/**
 * @description Writes a speaker's info to their own markdown file
 */
function writeSpeakerFile(speaker, callback) {
	const baseDir = './content/speaker'
  const filename = slug(`${speaker.data.name}`)
    .toLowerCase()
  let file = path.resolve('./content/speaker/', filename)
	// Create the content/speaker dir if it does not already exist
	mkdirp.sync(baseDir)

	fs.stat(`${file}.md`, function(err, stats) {
		if (err) {
			callback(err)
		}
		// If a file of the same name exists, append a date
		if (stats && stats.isFile()) {
			file += `-${Date.now()}`
		}

		fs.writeFile(`${file}.md`, speaker.markdown, { flag: 'w', }, (err) => {
	    if (err) {
	      return callback(err)
	    }
	    callback()
	  })
	})
}

/**
 * @description Parse out name, title, company (if provided) and links
 * IMPORTANT: This assumes one links listed for a speaker are all on the same
 * line.
 */
function parseSpeaker(data) {
  let info = {}
  let links = []

  info.name = data[0]
  info.title = data[1]

  if (data.length === 3) {
    info.links = parseSpeakerLinks(data[2])
  } else {
    info.company = data[2]
    info.links = parseSpeakerLinks(data[3])
  }
  return info
}

/**
 * @description Takes the markdown links and forms an object
 */
function parseSpeakerLinks(str) {
  let parts = str.split('|').map((l) => l.trim())
  return parts.map((link) => {
    let info = {}
    const length = link.length
    const endLabelIndex = link.indexOf(']')
    const urlPart = link.slice(endLabelIndex+2).trim()
    const label = link.slice(1, endLabelIndex)
    const url = urlPart.slice(0, urlPart.length-1)
    if (url) {
      info.href = url
    }
    if (label) {
      info.text = label
    }
    return info
  })
  return parts
}
