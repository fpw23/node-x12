'use strict'

export enum X12SegmentHeaderLoopStyle {
  Bounded = 'bounded',
  Unbounded = 'unbounded'
}

export interface X12SegmentHeader {
  tag: string
  trailer?: string
  layout: any
  loopStyle?: X12SegmentHeaderLoopStyle
  loopIdIndex?: number
  loopNoUnboundedChildren?: boolean
}

export const ISASegmentHeader: X12SegmentHeader = {
  tag: 'ISA',
  trailer: 'IEA',
  layout: {
    ISA01: 2,
    ISA02: 10,
    ISA03: 2,
    ISA04: 10,
    ISA05: 2,
    ISA06: 15,
    ISA07: 2,
    ISA08: 15,
    ISA09: 6,
    ISA10: 4,
    ISA11: 1,
    ISA12: 5,
    ISA13: 9,
    ISA14: 1,
    ISA15: 1,
    ISA16: 1,
    COUNT: 16,
    PADDING: true
  },
  loopStyle: X12SegmentHeaderLoopStyle.Bounded
}

export const GSSegmentHeader: X12SegmentHeader = {
  tag: 'GS',
  trailer: 'GE',
  layout: {
    GS01: 2,
    GS02: 15,
    GS02_MIN: 2,
    GS03: 15,
    GS03_MIN: 2,
    GS04: 8,
    GS05: 8,
    GS05_MIN: 4,
    GS06: 9,
    GS06_MIN: 1,
    GS07: 2,
    GS07_MIN: 1,
    GS08: 12,
    GS08_MIN: 1,
    COUNT: 8,
    PADDING: false
  },
  loopStyle: X12SegmentHeaderLoopStyle.Bounded
}

export const STSegmentHeader: X12SegmentHeader = {
  tag: 'ST',
  trailer: 'SE',
  layout: {
    ST01: 3,
    ST02: 9,
    ST02_MIN: 4,
    COUNT: 2,
    PADDING: false
  },
  loopStyle: X12SegmentHeaderLoopStyle.Bounded,
  loopIdIndex: 1
}

export const LSSegmentHeader: X12SegmentHeader = {
  tag: 'LS',
  trailer: 'LE',
  layout: {
    LS01: 4,
    LS01_MIN: 1,
    COUNT: 1,
    PADDING: false
  },
  loopStyle: X12SegmentHeaderLoopStyle.Bounded,
  loopIdIndex: 1,
  loopNoUnboundedChildren: true
}

export const LESegmentHeader: X12SegmentHeader = {
  tag: 'LE',
  layout: {
    LS01: 4,
    LS01_MIN: 1,
    COUNT: 1,
    PADDING: false
  }
}

export const HLSegmentHeader: X12SegmentHeader = {
  tag: 'HL',
  layout: {
    HL01: 12,
    HL01_MIN: 1,
    HL02: 12,
    HL03: 2,
    HL03_MIN: 1,
    HL04: 1,
    COUNT: 4,
    PADDING: false
  },
  loopStyle: X12SegmentHeaderLoopStyle.Unbounded,
  loopIdIndex: 3
}

export const StandardSegmentHeaders = [
  ISASegmentHeader,
  GSSegmentHeader,
  STSegmentHeader,
  HLSegmentHeader,
  LSSegmentHeader,
  LESegmentHeader
]
