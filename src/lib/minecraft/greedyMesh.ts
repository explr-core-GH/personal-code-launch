export interface Rectangle {
  u: number;
  v: number;
  w: number;
  h: number;
}

/**
 * Greedy-merge a 2D occupancy grid into the smallest set of axis-aligned
 * rectangles that cover exactly the occupied cells. The grid is row-major:
 * grid[v * width + u] is truthy when cell (u, v) is occupied.
 *
 * Scans rows top-to-bottom; for each occupied cell, extends a rectangle
 * rightward as far as adjacent cells of the same row are occupied, then
 * downward as far as every cell in the rectangle's columns remains occupied.
 * Mutates the input grid (cleared as cells are consumed).
 */
export function greedyMeshGrid(
  grid: Uint8Array,
  width: number,
  height: number,
): Rectangle[] {
  if (grid.length !== width * height) {
    throw new Error(
      `grid length ${grid.length} does not match width * height ${width * height}`,
    );
  }

  const rects: Rectangle[] = [];

  for (let v = 0; v < height; v++) {
    let u = 0;
    while (u < width) {
      if (!grid[v * width + u]) {
        u++;
        continue;
      }

      let w = 1;
      while (u + w < width && grid[v * width + (u + w)]) {
        w++;
      }

      let h = 1;
      growHeight: while (v + h < height) {
        for (let k = 0; k < w; k++) {
          if (!grid[(v + h) * width + (u + k)]) {
            break growHeight;
          }
        }
        h++;
      }

      for (let dv = 0; dv < h; dv++) {
        for (let du = 0; du < w; du++) {
          grid[(v + dv) * width + (u + du)] = 0;
        }
      }

      rects.push({ u, v, w, h });
      u += w;
    }
  }

  return rects;
}
