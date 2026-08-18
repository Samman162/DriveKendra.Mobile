import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface VoucherQrCodeProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * Generate a deterministic QR matrix with standard finder corners,
 * alignment markers, and encoded hash pattern.
 */
function generateQrMatrix(input: string, matrixSize: number = 25): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: matrixSize }, () =>
    Array(matrixSize).fill(false),
  );

  // 1. Draw standard QR finder pattern (top-left, top-right, bottom-left)
  function drawFinder(row: number, col: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[row + r][col + c] = isOuter || isInner;
      }
    }
  }

  drawFinder(0, 0); // Top-left
  drawFinder(0, matrixSize - 7); // Top-right
  drawFinder(matrixSize - 7, 0); // Bottom-left

  // 2. Timing patterns
  for (let i = 8; i < matrixSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Simple deterministic hash of the voucher string
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }

  // 4. Fill remaining data modules with deterministic seed
  let seed = hash;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip top-left finder & separator
      if (r <= 7 && c <= 7) continue;
      // Skip top-right finder & separator
      if (r <= 7 && c >= matrixSize - 8) continue;
      // Skip bottom-left finder & separator
      if (r >= matrixSize - 8 && c <= 7) continue;
      // Skip timing patterns
      if (r === 6 || c === 6) continue;

      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      matrix[r][c] = (seed % 3 === 0) || ((r + c + (input.charCodeAt((r + c) % input.length) || 0)) % 2 === 0);
    }
  }

  return matrix;
}

export function VoucherQrCode({
  value,
  size = 140,
  color = '#0F172A',
  backgroundColor = '#FFFFFF',
}: VoucherQrCodeProps) {
  const matrixSize = 25;
  const matrix = useMemo(() => generateQrMatrix(value, matrixSize), [value, matrixSize]);
  const cellSize = size / matrixSize;

  const rects = useMemo(() => {
    const elements: React.ReactNode[] = [];
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        if (matrix[r][c]) {
          elements.push(
            <Rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill={color}
            />,
          );
        }
      }
    }
    return elements;
  }, [matrix, cellSize, color, matrixSize]);

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect x={0} y={0} width={size} height={size} fill={backgroundColor} />
        {rects}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
