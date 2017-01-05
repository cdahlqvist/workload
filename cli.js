#!/usr/bin/env node
'use strict'

var http = require('http')
var argv = require('minimist')(process.argv.slice(2))
var csv = require('csv-line')
var Workload = require('./')
var pkg = require('./package')

if (argv.h || argv.help) help()
else if (argv.v || argv.version) version()
else if (argv._.length) run()
else invalid()

function run () {
  var opts = {
    max: argv.max
  }

  if (argv.filter === 'WH') opts.filter = Workload.stdFilters.workingHours
  if (argv.H) opts.headers = parseHeaders(argv.H)
  if (argv.H) opts.headers = parseHeaders(argv.H)

  opts.requests = argv._.map(function (line) {
    var parts = csv.decode(line)
    var req = {}
    if (Number.isFinite(parts[0])) req.weight = parts.shift()
    if (http.METHODS.indexOf(parts[0]) !== -1) req.method = parts.shift()
    req.url = parts.shift()
    if (parts.length) req.body = parts[0]
    return req
  })

  var workload = new Workload(opts)

  if (!argv.silent) {
    workload.on('visit', function (visit) {
      var method = visit.request.method || 'GET'
      var url = visit.request.url
      var code = visit.response.statusCode
      console.log(code, http.STATUS_CODES[code], method, url)
    })
  }
}

function parseHeaders (lines) {
  var headers = {}
  lines.forEach(function (line) {
    var split = line.indexOf(':')
    headers[line.slice(0, split)] = line.slice(split + 1).trim()
  })
  return headers
}

function invalid () {
  console.log('ERROR: Invalid arguments!')
  console.log()
  help()
  process.exit(1)
}

function help () {
  console.log('Usage:')
  console.log('  %s [options] requests...', pkg.name)
  console.log()
  console.log('Options:')
  console.log()
  console.log('  -h, --help     Show this help')
  console.log('  -v, --version  Show the version')
  console.log('  --silent       Don\'t output anything')
  console.log('  --max NUM      The maximum number of requests per second (default: 0.2')
  console.log('  --filter NAME  Use named standard filter (working hours: WH)')
  console.log('  -H LINE        Add default HTTP header (can be used multiple times)')
  console.log()
  console.log('Each request is a comma separated list of values follwoing this pattern:')
  console.log()
  console.log('  [WEIGHT,][METHOD,]URL[,BODY]')
  console.log()
  console.log('  WEIGHT  The numeric weight of the request (default: 1)')
  console.log('  METHOD  HTTP method (default: GET)')
  console.log('  URL     Full URL to request (required)')
  console.log('  BODY    The HTTP body')
  console.log()
  console.log('Examples:')
  console.log()
  console.log('  %s http://example.com http://example.com/foo', pkg.name)
  console.log('    Make two GET requests with equal weight')
  console.log()
  console.log('  %s 1,http://example.com 2,http://example.com/foo', pkg.name)
  console.log('    Make two GET requests with a double chance of the latter being made')
  console.log()
  console.log('  %s --max=1 http://example.com POST,http://example.com,"Hello World"', pkg.name)
  console.log('    Make a maximum of one request per second and make either a GET')
  console.log('    request or a POST request with the body "Hello World"')
  console.log()
  console.log('  %s -H "Accept: text/plain" http://example.com', pkg.name)
  console.log('    Set a custom Accept header')
  console.log()
}

function version () {
  console.log(pkg.version)
}