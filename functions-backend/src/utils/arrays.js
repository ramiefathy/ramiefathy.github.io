/**
 * Array Utilities
 * Helper functions for array manipulation
 */

/**
 * Split an array into chunks of specified size
 * Useful for batching Firestore operations (max 500 per batch)
 * @param {Array} items - Array to chunk
 * @param {number} size - Size of each chunk
 * @returns {Array<Array>} Array of chunks
 */
function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

module.exports = {
  chunkArray
};