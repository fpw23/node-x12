'use strict'

import 'mocha'
import { X12Parser, X12Interchange, X12Segment } from '../core'

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

  it.only('should set segment paths using segment header loopStyle', () => {
    const edi = fs.readFileSync('test/test-data/271.edi', 'utf8')
    const parser = new X12Parser(true)

    const interchange = parser.parse(edi) as X12Interchange

    const segmentPaths: any[] = []

    interchange.functionalGroups.forEach((fg) => {
      fg.transactions.forEach((t) => {
        t.segments.forEach((s) => {
          if (s.loopPath !== undefined) {
            segmentPaths.push(`${s.tag}: ${s.loopPath}`)
          }
        })
      })
    })

    console.log(segmentPaths)

    if (segmentPaths.length === 0) {
      throw new Error('Unable to find any segment loop paths')
    }
  })
})
