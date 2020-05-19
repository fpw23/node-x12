'use strict'

import 'mocha'
import { X12Parser, X12Interchange, X12Segment, StandardSegmentHeaders, X12SegmentHeaderLoopStyle } from '../core'

import fs = require('fs')

describe('X12Parser', () => {
  it('should parse a valid X12 document without throwing an error', () => {
    const edi = fs.readFileSync('test/test-data/850.edi', 'utf8')
    const parser = new X12Parser()
    parser.parse(edi)
  })

  it('should parse a fat X12 document without throwing an error', () => {
    const edi = fs.readFileSync('test/test-data/850_fat.edi', 'utf8')
    const parser = new X12Parser(true)
    parser.parse(edi)
  })

  it('should parse and reconstruct a valid X12 stream without throwing an error', async () => {
    return new Promise((resolve, reject) => {
      const ediStream = fs.createReadStream('test/test-data/850.edi', 'utf8')
      const parser = new X12Parser()
      const segments: X12Segment[] = []

      ediStream.on('error', (error) => {
        reject(error)
      })

      parser.on('error', (error) => {
        reject(error)
      })

      ediStream.pipe(parser).on('data', (data) => {
        segments.push(data)
      })
        .on('end', () => {
          const edi = fs.readFileSync('test/test-data/850.edi', 'utf8')
          const interchange = parser.getInterchangeFromSegments(segments)
          if (interchange.toString() !== edi) {
            reject(new Error('Expected parsed EDI stream to match raw EDI document.'))
          }
          resolve()
        })
    })
  })

  it('should produce accurate line numbers for files with line breaks', () => {
    const edi = fs.readFileSync('test/test-data/850_3.edi', 'utf8')
    const parser = new X12Parser()
    const interchange = parser.parse(edi) as X12Interchange

    const segments = [].concat(
      [interchange.header, interchange.functionalGroups[0].header, interchange.functionalGroups[0].transactions[0].header],
      interchange.functionalGroups[0].transactions[0].segments,
      [interchange.functionalGroups[0].transactions[0].trailer, interchange.functionalGroups[0].trailer, interchange.trailer]
    )

    for (let i = 0; i < segments.length; i++) {
      const segment: X12Segment = segments[i]

      if (i !== segment.range.start.line) {
        throw new Error(`Segment line number incorrect. Expected ${i}, found ${segment.range.start.line}.`)
      }
    }
  })

  it('should throw an ArgumentNullError', () => {
    const parser = new X12Parser()
    let error

    try {
      parser.parse(undefined)
    } catch (err) {
      error = err
    }

    if (error.name !== 'ArgumentNullError') {
      throw new Error('ArgumentNullError expected when first argument to X12Parser.parse() is undefined.')
    }
  })

  it('should throw an ParserError', () => {
    const parser = new X12Parser(true)
    let error

    try {
      parser.parse('')
    } catch (err) {
      error = err
    }

    if (error.name !== 'ParserError') {
      throw new Error('ParserError expected when document length is too short and parser is strict.')
    }
  })

  it('should find mismatched elementDelimiter', () => {
    const edi = fs.readFileSync('test/test-data/850.edi', 'utf8')
    const parser = new X12Parser(true)
    let error

    try {
      parser.parse(edi, { elementDelimiter: '+' })
    } catch (err) {
      error = err
    }

    if (error.name !== 'ParserError') {
      throw new Error('ParserError expected when elementDelimiter in document does not match and parser is strict.')
    }
  })

  it('should parse segment loops when set in option segmentHeaders', () => {
    const edi = fs.readFileSync('test/test-data/271.edi', 'utf8')
    const parser = new X12Parser({
      segmentHeaders: [
        ...StandardSegmentHeaders,
        {
          tag: 'NM1',
          layout: {
            NM101: 3,
            NM101_MIN: 2,
            NM102: 1,
            NM102_MIN: 1,
            NM103: 60,
            NM103_MIN: 1,
            NM104: 35,
            NM105: 25,
            NM106: 10,
            NM107: 10,
            NM108: 2,
            NM108_MIN: 1,
            NM109: 80,
            NM109_MIN: 2,
            NM110: 2,
            NM111: 3,
            NM112: 60,
            COUNT: 12,
            PADDING: false
          },
          loopStyle: X12SegmentHeaderLoopStyle.Unbounded,
          loopIdIndex: 1
        },
        {
          tag: 'EB',
          layout: {
            EB01: 3,
            EB01_MIN: 1,
            EB02: 3,
            EB03: 2,
            EB04: 3,
            EB05: 50,
            EB06: 2,
            EB07: 18,
            EB08: 10,
            EB09: 2,
            EB10: 15,
            EB11: 1,
            EB12: 1,
            EB13: 1,
            EB14: 1,
            COUNT: 14,
            PADDING: false
          },
          loopStyle: X12SegmentHeaderLoopStyle.Unbounded,
          loopIdIndex: 1
        }
      ]
    })

    const interchange = parser.parse(edi) as X12Interchange

    const segmentPaths = interchange.getSegmentLoops()

    if (segmentPaths.length === 0) {
      throw new Error('Unable to find any segment loop paths')
    }
  })
})
