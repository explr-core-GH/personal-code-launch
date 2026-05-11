import { describe, it, expect } from 'vitest';
import { greedyMeshGrid } from '../greedyMesh';

function gridFrom(rows: string[]): { grid: Uint8Array; width: number; height: number } {
  const height = rows.length;
  const width = rows[0].length;
  const grid = new Uint8Array(width * height);
  for (let v = 0; v < height; v++) {
    for (let u = 0; u < width; u++) {
      grid[v * width + u] = rows[v][u] === '#' ? 1 : 0;
    }
  }
  return { grid, width, height };
}

describe('greedyMeshGrid', () => {
  it('returns no rectangles for an empty grid', () => {
    const { grid, width, height } = gridFrom(['...', '...']);
    expect(greedyMeshGrid(grid, width, height)).toEqual([]);
  });

  it('emits a single rectangle covering a solid grid', () => {
    const { grid, width, height } = gridFrom(['###', '###']);
    expect(greedyMeshGrid(grid, width, height)).toEqual([
      { u: 0, v: 0, w: 3, h: 2 },
    ]);
  });

  it('splits a non-rectangular shape into multiple rectangles', () => {
    // L-shape: two rectangles
    const { grid, width, height } = gridFrom([
      '##',
      '##',
      '#.',
    ]);
    const rects = greedyMeshGrid(grid, width, height);
    expect(rects).toEqual([
      { u: 0, v: 0, w: 2, h: 2 },
      { u: 0, v: 2, w: 1, h: 1 },
    ]);
  });

  it('greedily extends rectangles right then down', () => {
    const { grid, width, height } = gridFrom([
      '###.',
      '###.',
      '..##',
    ]);
    const rects = greedyMeshGrid(grid, width, height);
    expect(rects).toEqual([
      { u: 0, v: 0, w: 3, h: 2 },
      { u: 2, v: 2, w: 2, h: 1 },
    ]);
  });

  it('handles isolated single cells', () => {
    const { grid, width, height } = gridFrom([
      '#.#',
      '...',
      '#.#',
    ]);
    const rects = greedyMeshGrid(grid, width, height);
    expect(rects).toHaveLength(4);
    expect(rects).toContainEqual({ u: 0, v: 0, w: 1, h: 1 });
    expect(rects).toContainEqual({ u: 2, v: 0, w: 1, h: 1 });
    expect(rects).toContainEqual({ u: 0, v: 2, w: 1, h: 1 });
    expect(rects).toContainEqual({ u: 2, v: 2, w: 1, h: 1 });
  });

  it('throws on dimension mismatch', () => {
    expect(() => greedyMeshGrid(new Uint8Array(4), 2, 3)).toThrow();
  });
});
