#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const moment = require('moment');
const prettyBytes = require('pretty-bytes');
const bitrate = require('bitrate');
const Tail = require('tail').Tail;
require('colors');

let N = 150;
let LOG_FILE = null;
let FOLLOW = false;

// Parse arguments
const args = process.argv.slice(2);
if(args.length) {
  for(let i = 0; i < args.length; i++) {
    const param = args[i];
    switch(param) {
      case '-n': {
        N = parseInt(args[i + 1]);
        i++;
        break;
      }
      case '-f': {
        FOLLOW = true;
        break;
      }
      default: {
        LOG_FILE = param;
      }
    }
  }
}

if(!LOG_FILE) {
  LOG_FILE = detectLogFileLocation();
}

const file = fs.readFileSync(LOG_FILE, 'utf8');

const lines = file.split('\n');
const linesToPrint = [];

let lastIndex, lastDate;

let i = 0;
for(const line of lines) {
  const str = processLine(line);
  if(!str) continue;
  linesToPrint.push(str);
}

const sliced = N < linesToPrint.length ? linesToPrint.slice(-N) : linesToPrint;
for(const line of sliced) {
  console.log(line);
}

if(FOLLOW) {
  const tail = new Tail(LOG_FILE);
  tail.watch();
  tail.on('line', line => {
    const str = processLine(line);
    if(str) console.log(str);
  });
}

function processLine(line) {
  const lineElements = line.split(' ');
  if(lineElements.length < 5 || lineElements[4].length !== 32) {
    i++;
    return false;
  }
  const [
    outcome,
    date,
    time,
    fortyTwo, // What for?
    hash,     // Useless for this script
    isFolder,
    ...rest
  ] = lineElements;

  if(parseInt(isFolder)) return false;

  const parsedDate = moment.utc(`${date} ${time}`, 'MM/DD/YY hh:mma').local();

  let deletion = false;
  let additionalData;
  let additionalDataRaw;
  try {
    additionalDataRaw = rest.pop();
    if(additionalDataRaw === '(deleted)') {
      deletion = true;
    } else {
      additionalData = JSON.parse(additionalDataRaw);
    }
  } catch(e) {
    console.log(line);
    return line;
  }

  let path;

  let summary = '';
  if(!deletion) {
    const fileSize = parseInt(rest.pop().slice(1, -1));
    path = rest.join(' ');
    const uploadedBytes = additionalData[2];
    const didUpload = uploadedBytes > 0;
    let speed;
    let duration;
    let transferStats;
    if(lastIndex === i - 1) {
      duration = moment.duration(parsedDate.diff(lastDate)).asMinutes();
      speed = bitrate(uploadedBytes, duration * 60, 'mbps');
      transferStats = `⬆ ${prettyBytes(parseInt(fileSize))} in ${duration} mins`;
      if(duration) transferStats += ` (approx. ${speed.toFixed(1)}mbps)`;
    }

    summary = didUpload ? transferStats ? transferStats.cyan : '' : `➡ FILE HASH MATCH (${prettyBytes(parseInt(fileSize))})`.green;
  } else {
    path = rest.join(' ');
    summary = `✘ [DELETED]`.yellow;
  }

  const str = `${outcome === 'I' ? '✔'.green : '✘'.red} ${parsedDate.format('YYYY-MM-DD').magenta} ${parsedDate.format('HH:mm').magenta}${summary ? ` - ${summary}` : ''} ${path}`;

  lastDate = parsedDate;
  lastIndex = i;
  i++;

  return str;
}

function detectLogFileLocation() {
  const possibleLocations = [];
  switch(os.platform()) {
    case 'darwin': {
      possibleLocations.push(
        `/Library/Logs/CrashPlan`,
        ` ~/Library/Logs/CrashPlan`,
      );
      break;
    }
    case 'linux': {
      possibleLocations.push(
        `/usr/local/crashplan/log`,
      );
      break;
    }
    case 'win32': {
      possibleLocations.push(
        `C:/ProgramData/CrashPlan/log`,
        `${process.env.APPDATA}/Local/CrashPlan/log`,
        `${process.env.APPDATA}/Roaming/CrashPlan/log`,
      );
      break;
    }
  }
  let location = null;
  for(const possibleLocation of possibleLocations) {
    const result = checkLocation(possibleLocation);
    if(result) {
      location = result;
      break;
    }
  }

  if(!location) {
    console.error(`${`ERROR:`.red} Can't auto-detect logfile location. Try passing it as the last argument.`);
    process.exit(1);
  }

  return location;
}

function checkLocation(location) {
  let result = null;
  for(const file of [`${location}/backup_files.log`, `${location}/backup_files.log.0`]) {
    console.log(`${'Trying path for logfile:'.cyan} ${file}...`);
    const normalizedPath = path.normalize(file);
    try {
      if(fs.statSync(normalizedPath).isFile()) {
        result = normalizedPath;
        console.log(`Logfile found!`);
      }
    } catch(e) { /* File doesnt exist */ }
  }
  return result;
}
