function readUint16(view, offset, littleEndian) {
  return view.getUint16(offset, littleEndian)
}

/**
 * Returns JPEG EXIF orientation value (1-8). Returns null when unavailable.
 *
 * @param {ArrayBuffer|Uint8Array} input
 * @returns {number|null}
 */
export function readJpegExifOrientation(input) {
  const buffer = input instanceof Uint8Array
    ? input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
    : input

  if (!(buffer instanceof ArrayBuffer)) return null
  const view = new DataView(buffer)

  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    return null
  }

  let offset = 2
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset)
    offset += 2

    if (marker === 0xffda || marker === 0xffd9) {
      break
    }

    const length = view.getUint16(offset)
    if (!length || offset + length > view.byteLength) {
      break
    }

    if (marker === 0xffe1) {
      const exifStart = offset + 2
      if (view.getUint32(exifStart) !== 0x45786966) {
        break
      }

      const tiffOffset = exifStart + 6
      const littleEndian = view.getUint16(tiffOffset) === 0x4949
      const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian)
      let ifdPointer = tiffOffset + firstIfdOffset

      if (ifdPointer + 2 > view.byteLength) return null
      const entries = readUint16(view, ifdPointer, littleEndian)
      ifdPointer += 2

      for (let index = 0; index < entries; index += 1) {
        const entryOffset = ifdPointer + index * 12
        if (entryOffset + 12 > view.byteLength) break
        const tag = readUint16(view, entryOffset, littleEndian)
        if (tag === 0x0112) {
          return readUint16(view, entryOffset + 8, littleEndian)
        }
      }

      return null
    }

    offset += length
  }

  return null
}
