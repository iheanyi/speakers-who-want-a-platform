
'use strict'

const fs = require('fs')
const es = require('event-stream')

fs.createReadStream('./speakers-clean.md')
  .pipe(es.split(/^$/m))
  .pipe(es.map(function(data, callback) {
    const lines = data.split('\n')
    const len = lines.length
    const speakerInfo = lines.splice(1, len-2)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 ? true : false)
    callback(null, speakerInfo)
  }))
  .pipe(es.through(function write(data) {
    const speaker = parseSpeaker(data)
    console.log(speaker)
  }))
  .pipe(process.stdout)




/**
 * @description Parse out name, title, company (if provided) and links
 *
 *
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
