'use strict'

import { JSEDISegment } from './JSEDINotation'
import { Range } from './Positioning'
import { X12Element } from './X12Element'
import {
  X12SupportedSegments,
  X12InterchangeControlHeader,
  X12FunctionalGroupHeader,
  X12TransactionSetHeader
} from './X12Enumerables'
import {
  defaultSerializationOptions,
  discoverValueType,
  X12SerializationOptions
} from './X12SerializationOptions'
import { GeneratorError } from './Errors'
import { X12Date } from './X12DataTypes/X12Date'
import { X12Time } from './X12DataTypes/X12Time'

export class X12Segment {
  /**
   * @description Create a segment.
   * @param {string} tag - The tag for this segment.
   * @param {X12SerializationOptions} [options] - Options for serializing back to EDI.
   */
  constructor (tag: string = '', options?: X12SerializationOptions) {
    this.tag = tag
    this.elements = new Array<X12Element>()
    this.range = new Range()
    this.options = defaultSerializationOptions(options)
  }

  tag: string;
  elements: X12Element[];
  range: Range;
  options: X12SerializationOptions;

  /**
   * @description Set the elements of this segment.
   * @param {Array<string | number | X12Date | X12Time>} values - An array of element values.
   * @param {boolean} [discoverTypes=false] - Optional flag to discover the value types.
   */
  setElements (values: Array<string | number | X12Date | X12Time>, discoverTypes: boolean = false): void {
    this._formatValues(values)
    this.elements = new Array<X12Element>()
    values.forEach((value) => {
      let result: string | number | X12Date | X12Time

      if (discoverTypes || this.options.discoverTypes) {
        result = discoverValueType(value as string)
      } else {
        result = value
      }

      this.elements.push(new X12Element(result))
    })
  }

  /**
   * @description Add an element to this segment.
   * @param {string} value - A string value.
   * @returns {X12Element} The element that was added to this segment.
   */
  addElement (value: string = ''): X12Element {
    const element = new X12Element(value)

    this.elements.push(element)

    return element
  }

  /**
   * @description Replace an element at a position in the segment.
   * @param {string} value - A string value.
   * @param {number} segmentPosition - A 1-based number indicating the position in the segment.
   * @returns {X12Element} The new element if successful, or a null if failed.
   */
  replaceElement (value: string, segmentPosition: number): X12Element {
    const index = segmentPosition - 1

    if (this.elements.length <= index) {
      return null
    } else {
      this.elements[index] = new X12Element(value)
    }

    return this.elements[index]
  }

  /**
   * @description Insert an element at a position in the segment.
   * @param {string} value - A string value.
   * @param {number} segmentPosition - A 1-based number indicating the position in the segment.
   * @returns {X12Element} The new element if successful, or a null if failed.
   */
  insertElement (value: string = '', segmentPosition: number = 1): boolean {
    const index = segmentPosition - 1

    if (this.elements.length <= index) {
      return null
    }

    return this.elements.splice(index, 0, new X12Element(value)).length === 1
  }

  /**
   * @description Remove an element at a position in the segment.
   * @param {number} segmentPosition - A 1-based number indicating the position in the segment.
   * @returns {boolean} True if successful.
   */
  removeElement (segmentPosition: number): boolean {
    const index = segmentPosition - 1

    if (this.elements.length <= index) {
      return false
    }

    return this.elements.splice(index, 1).length === 1
  }

  /**
   * @description Get the value of an element in this segment.
   * @param {number} segmentPosition - A 1-based number indicating the position in the segment.
   * @param {string} [defaultValue] - A default value to return if there is no element found.
   * @returns {string} If no element is at this position, null or the default value will be returned.
   */
  valueOf (segmentPosition: number, defaultValue?: string): string | number | X12Date | X12Time {
    const index = segmentPosition - 1

    if (this.elements.length <= index) {
      return defaultValue === undefined ? null : defaultValue
    }

    return this.elements[index].value === undefined
      ? defaultValue === undefined
        ? null
        : defaultValue
      : this.elements[index].value
  }

  /**
   * @description Serialize segment to EDI string.
   * @param {X12SerializationOptions} [options] - Options for serializing back to EDI.
   * @returns {string} This segment converted to an EDI string.
   */
  toString (options?: X12SerializationOptions): string {
    options = options !== undefined
      ? defaultSerializationOptions(options)
      : this.options

    let edi = this.tag

    for (let i = 0; i < this.elements.length; i++) {
      edi += options.elementDelimiter
      if ((this.tag === 'ISA' && i === 12) || (this.tag === 'IEA' && i === 1)) {
        edi += String.prototype.padStart.call(this.elements[i].value, 9, '0')
      } else {
        edi += this.elements[i].value
      }
    }

    edi += options.segmentTerminator

    return edi
  }

  /**
   * @description Serialize transaction set to JSON object.
   * @returns {object} This segment converted to an object.
   */
  toJSON (): object {
    return new JSEDISegment(this.tag, this.elements.map(x => `${x.value}`)) as object
  }

  /**
   * @private
   * @description Check to see if segment is predefined.
   * @returns {boolean} True if segment is predefined.
   */
  private _checkSupportedSegment (): boolean {
    let supported = false

    switch (this.tag) {
      case X12SupportedSegments.ISA:
        supported = true
        break
      case X12SupportedSegments.GS:
        supported = true
        break
      case X12SupportedSegments.ST:
        supported = true
        break
    }

    return supported
  }

  /**
   * @private
   * @description Get the definition of this segment.
   * @returns {object} The definition of this segment.
   */
  private _getX12Enumerable (): any {
    let enumerable = X12InterchangeControlHeader

    switch (this.tag) {
      case X12SupportedSegments.ISA:
        enumerable = X12InterchangeControlHeader
        break
      case X12SupportedSegments.GS:
        enumerable = X12FunctionalGroupHeader
        break
      case X12SupportedSegments.ST:
        enumerable = X12TransactionSetHeader
        break
    }

    return enumerable
  }

  /**
   * @private
   * @description Format and validate the element values according the segment definition.
   * @param {string[]} values - An array of element values.
   */
  private _formatValues (values: Array<string | number | X12Date | X12Time>): void {
    if (this._checkSupportedSegment()) {
      const enumerable = this._getX12Enumerable()

      if (this.tag === X12SupportedSegments.ISA && this.options.subElementDelimiter.length === 1) {
        values[15] = this.options.subElementDelimiter
      }

      if (values.length === enumerable.COUNT) {
        for (let i = 0; i < values.length; i++) {
          const name = `${this.tag}${String.prototype.padStart.call(i + 1, 2, '0')}`
          const max = enumerable[name]
          const min = enumerable[`${name}_MIN`] === undefined ? 0 : enumerable[`${name}_MIN`]

          values[i] = `${values[i]}`

          if ((values[i] as string).length > max && (values[i] as string).length !== 0) {
            throw new GeneratorError(`Segment element "${name}" with value of "${values[i]}" exceeds maximum of ${max} characters.`)
          }

          if ((values[i] as string).length < min && (values[i] as string).length !== 0) {
            throw new GeneratorError(`Segment element "${name}" with value of "${values[i]}" does not meet minimum of ${min} characters.`)
          }

          if (enumerable.PADDING as boolean && (((values[i] as string).length < max && (values[i] as string).length > min) || (values[i] as string).length === 0)) {
            if (name === 'ISA13') {
              values[i] = String.prototype.padStart.call(values[i], max, '0')
            } else {
              values[i] = String.prototype.padEnd.call(values[i], max, ' ')
            }
          }
        }
      } else {
        throw new GeneratorError(`Segment "${this.tag}" with ${values.length} elements does meet the required count of ${enumerable.COUNT}.`)
      }
    }
  }
}
