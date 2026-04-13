/**
 * optimizedSort — Timsort-inspired hybrid sort (insertion sort + natural-run merge).
 *
 * Characteristics:
 *  - O(n)        best case  (already-sorted / nearly-sorted input)
 *  - O(n log n)  average / worst case
 *  - Stable      (equal elements preserve their original order)
 *  - In-place    (auxiliary memory is O(n) for merge buffers, stack is O(log n))
 *
 * Handles edge cases: empty array, single element, all-equal, descending runs,
 * arrays containing NaN / Infinity / -Infinity (NaN is sorted to the end).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum run length fed into the merge phase. */
const MIN_MERGE = 32;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Computes the minimum natural run length for an array of length `n`.
 * The result r satisfies MIN_MERGE/2 ≤ r ≤ MIN_MERGE such that n/r
 * is close to a power of two.
 */
function minRunLength(n: number): number {
  let r = 0;
  while (n >= MIN_MERGE) {
    r |= n & 1;
    n >>= 1;
  }
  return n + r;
}

/**
 * Numeric comparator that pushes NaN to the end (consistent with
 * Array.prototype.sort default numeric semantics when a - b is used).
 */
function compare(a: number, b: number): number {
  // NaN comparisons are always false; sort NaN after everything else.
  if (a !== a) return 1;  // a is NaN
  if (b !== b) return -1; // b is NaN
  return a - b;
}

/**
 * Binary-insertion sort of arr[lo..hi] (inclusive), assuming arr[lo..start-1]
 * is already sorted. Runs in O((hi - lo + 1)²) time but with small constants
 * and excellent cache behaviour for short sequences.
 */
function binaryInsertionSort(
  arr: number[],
  lo: number,
  hi: number,
  start: number,
): void {
  for (let i = start; i <= hi; i++) {
    const pivot = arr[i];

    // Binary-search for the insertion point in arr[lo..i-1].
    let left = lo;
    let right = i;
    while (left < right) {
      const mid = (left + right) >>> 1;
      if (compare(pivot, arr[mid]) < 0) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    // Shift elements right to open the slot.
    for (let j = i; j > left; j--) {
      arr[j] = arr[j - 1];
    }
    arr[left] = pivot;
  }
}

/**
 * Reverses arr[lo..hi) in place.
 */
function reverseRange(arr: number[], lo: number, hi: number): void {
  let tail = hi - 1;
  while (lo < tail) {
    const tmp = arr[lo];
    arr[lo] = arr[tail];
    arr[tail] = tmp;
    lo++;
    tail--;
  }
}

/**
 * Starting at `lo`, finds a natural run (ascending or strictly descending) and
 * returns its exclusive upper bound. Descending runs are reversed in place so
 * the caller always receives an ascending run.
 */
function countAndPrepareRun(arr: number[], lo: number, hi: number): number {
  // A run of length 1 is trivially ascending.
  if (lo + 1 >= hi) return lo + 1;

  let runHi = lo + 1;

  if (compare(arr[runHi], arr[lo]) < 0) {
    // Strictly descending — find extent then reverse.
    while (runHi < hi && compare(arr[runHi], arr[runHi - 1]) < 0) {
      runHi++;
    }
    reverseRange(arr, lo, runHi);
  } else {
    // Non-descending (ascending) — find extent.
    while (runHi < hi && compare(arr[runHi], arr[runHi - 1]) >= 0) {
      runHi++;
    }
  }

  return runHi;
}

/**
 * Merges arr[lo..mid) with arr[mid..hi) into arr[lo..hi).
 * Uses a temporary copy of the shorter half to minimise auxiliary memory.
 */
function mergeAdjacentRuns(
  arr: number[],
  lo: number,
  mid: number,
  hi: number,
): void {
  const leftLen = mid - lo;
  const rightLen = hi - mid;

  if (leftLen === 0 || rightLen === 0) return;

  if (leftLen <= rightLen) {
    // Copy the left half into a temporary buffer.
    const tmp = arr.slice(lo, mid);
    let i = 0;        // index into tmp
    let j = mid;      // index into right half (in-place)
    let k = lo;       // write position

    while (i < leftLen && j < hi) {
      if (compare(tmp[i], arr[j]) <= 0) {
        arr[k++] = tmp[i++];
      } else {
        arr[k++] = arr[j++];
      }
    }
    while (i < leftLen) arr[k++] = tmp[i++];
    // Remaining right elements are already in place.
  } else {
    // Copy the right half into a temporary buffer.
    const tmp = arr.slice(mid, hi);
    let i = mid - 1;         // index into left half (in-place), scanning backwards
    let j = rightLen - 1;    // index into tmp, scanning backwards
    let k = hi - 1;          // write position

    while (i >= lo && j >= 0) {
      if (compare(arr[i], tmp[j]) > 0) {
        arr[k--] = arr[i--];
      } else {
        arr[k--] = tmp[j--];
      }
    }
    while (j >= 0) arr[k--] = tmp[j--];
    // Remaining left elements are already in place.
  }
}

// ---------------------------------------------------------------------------
// Run stack & merge policy
// ---------------------------------------------------------------------------

/**
 * Enforces the Timsort invariants on the run stack:
 *   (A) runLen[i - 2] > runLen[i - 1] + runLen[i]
 *   (B) runLen[i - 1] > runLen[i]
 *
 * This guarantees O(n log n) total merge work and stack depth O(log n).
 */
function mergeCollapse(
  arr: number[],
  runBase: number[],
  runLen: number[],
): void {
  while (runLen.length > 1) {
    const n = runLen.length - 1;

    if (
      n > 1 &&
      runLen[n - 2] <= runLen[n - 1] + runLen[n]
    ) {
      if (runLen[n - 2] < runLen[n]) {
        // Merge n-2 with n-1.
        mergeAdjacentRuns(
          arr,
          runBase[n - 2],
          runBase[n - 1],
          runBase[n - 1] + runLen[n - 1],
        );
        runLen[n - 2] += runLen[n - 1];
        runBase.splice(n - 1, 1);
        runLen.splice(n - 1, 1);
      } else {
        // Merge n-1 with n.
        mergeAdjacentRuns(
          arr,
          runBase[n - 1],
          runBase[n],
          runBase[n] + runLen[n],
        );
        runLen[n - 1] += runLen[n];
        runBase.pop();
        runLen.pop();
      }
    } else if (runLen[n - 1] <= runLen[n]) {
      // Merge n-1 with n.
      mergeAdjacentRuns(
        arr,
        runBase[n - 1],
        runBase[n],
        runBase[n] + runLen[n],
      );
      runLen[n - 1] += runLen[n];
      runBase.pop();
      runLen.pop();
    } else {
      break; // Both invariants satisfied.
    }
  }
}

/**
 * Merges all remaining runs on the stack until a single sorted run remains.
 */
function mergeForceCollapse(
  arr: number[],
  runBase: number[],
  runLen: number[],
): void {
  while (runLen.length > 1) {
    const n = runLen.length - 1;

    const idx =
      n > 1 && runLen[n - 2] < runLen[n] ? n - 2 : n - 1;

    mergeAdjacentRuns(
      arr,
      runBase[idx],
      runBase[idx + 1],
      runBase[idx + 1] + runLen[idx + 1],
    );
    runLen[idx] += runLen[idx + 1];
    runBase.splice(idx + 1, 1);
    runLen.splice(idx + 1, 1);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sorts `arr` in ascending order in place and returns it.
 *
 * @param arr - The array of numbers to sort.
 * @returns The same array reference, now sorted.
 */
export default function optimizedSort(arr: number[]): number[] {
  const n = arr.length;

  // Edge cases that require no work.
  if (n < 2) return arr;

  // Tiny arrays: insertion sort is optimal.
  if (n < MIN_MERGE) {
    binaryInsertionSort(arr, 0, n - 1, 1);
    return arr;
  }

  const minRun = minRunLength(n);
  const runBase: number[] = [];
  const runLen: number[] = [];

  let lo = 0;

  while (lo < n) {
    // Identify (and normalise to ascending) the next natural run.
    let runEnd = countAndPrepareRun(arr, lo, n);
    let len = runEnd - lo;

    // If the natural run is shorter than minRun, extend it with insertion sort.
    if (len < minRun) {
      const extendTo = Math.min(lo + minRun, n);
      binaryInsertionSort(arr, lo, extendTo - 1, lo + len);
      len = extendTo - lo;
    }

    runBase.push(lo);
    runLen.push(len);

    mergeCollapse(arr, runBase, runLen);

    lo += len;
  }

  mergeForceCollapse(arr, runBase, runLen);

  return arr;
}
