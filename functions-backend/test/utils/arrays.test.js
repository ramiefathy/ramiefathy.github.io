/**
 * Tests for Array Utilities
 */

const { describe, it } = require('mocha');
const assert = require('assert');
const { chunkArray } = require('../../src/utils/arrays');

describe('Array Utilities', () => {
  describe('chunkArray', () => {
    it('should split array into chunks of specified size', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = chunkArray(input, 3);

      assert.strictEqual(result.length, 4);
      assert.deepStrictEqual(result[0], [1, 2, 3]);
      assert.deepStrictEqual(result[1], [4, 5, 6]);
      assert.deepStrictEqual(result[2], [7, 8, 9]);
      assert.deepStrictEqual(result[3], [10]);
    });

    it('should handle exact divisions', () => {
      const input = [1, 2, 3, 4, 5, 6];
      const result = chunkArray(input, 2);

      assert.strictEqual(result.length, 3);
      assert.deepStrictEqual(result[0], [1, 2]);
      assert.deepStrictEqual(result[1], [3, 4]);
      assert.deepStrictEqual(result[2], [5, 6]);
    });

    it('should handle chunk size larger than array', () => {
      const input = [1, 2, 3];
      const result = chunkArray(input, 10);

      assert.strictEqual(result.length, 1);
      assert.deepStrictEqual(result[0], [1, 2, 3]);
    });

    it('should handle empty array', () => {
      const input = [];
      const result = chunkArray(input, 5);

      assert.strictEqual(result.length, 0);
      assert.deepStrictEqual(result, []);
    });

    it('should handle chunk size of 1', () => {
      const input = [1, 2, 3];
      const result = chunkArray(input, 1);

      assert.strictEqual(result.length, 3);
      assert.deepStrictEqual(result[0], [1]);
      assert.deepStrictEqual(result[1], [2]);
      assert.deepStrictEqual(result[2], [3]);
    });

    it('should work with Firestore batch size (500)', () => {
      const input = Array.from({ length: 1250 }, (_, i) => i);
      const result = chunkArray(input, 500);

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].length, 500);
      assert.strictEqual(result[1].length, 500);
      assert.strictEqual(result[2].length, 250);
    });

    it('should work with Firestore IN query limit (10)', () => {
      const input = ['id1', 'id2', 'id3', 'id4', 'id5', 'id6', 'id7', 'id8', 'id9', 'id10', 'id11', 'id12'];
      const result = chunkArray(input, 10);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].length, 10);
      assert.strictEqual(result[1].length, 2);
    });

    it('should preserve object references', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const obj3 = { id: 3 };
      const input = [obj1, obj2, obj3];

      const result = chunkArray(input, 2);

      assert.strictEqual(result[0][0], obj1); // Same reference
      assert.strictEqual(result[0][1], obj2);
      assert.strictEqual(result[1][0], obj3);
    });

    it('should handle arrays with different data types', () => {
      const input = [1, 'two', { three: 3 }, null, undefined, true];
      const result = chunkArray(input, 2);

      assert.strictEqual(result.length, 3);
      assert.deepStrictEqual(result[0], [1, 'two']);
      assert.deepStrictEqual(result[1], [{ three: 3 }, null]);
      assert.deepStrictEqual(result[2], [undefined, true]);
    });
  });
});