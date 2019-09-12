'use strict'

import 'mocha'
import { X12Parser, X12TransactionMap, X12Interchange } from '../core'

import fs = require('fs')

const edi = fs.readFileSync('test/test-data/850.edi', 'utf8')
const map_json = fs.readFileSync('test/test-data/850_map.json', 'utf8')
const result_json = fs.readFileSync('test/test-data/850_map_result.json', 'utf8')

describe('X12Mapping', () => {
    it('should map transaction', () => {
        const parser = new X12Parser()
        const interchange = parser.parse(edi) as X12Interchange
        const transaction = interchange.functionalGroups[0].transactions[0]
        const mapper = new X12TransactionMap(JSON.parse(map_json), transaction)
        const result = JSON.stringify(mapper.toObject())
console.log(result)
        if (result !== result_json) {
            throw new Error(`Formatted JSON does not match source. Found ${result}, expected ${result_json}.`)
        }
    })
})