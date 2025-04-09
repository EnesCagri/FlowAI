import { EdgeDetectionAlgorithm } from "../types";

const applyBlur = (
  data: number[],
  width: number,
  height: number,
  radius: number
): number[] => {
  // ... existing blur implementation ...
  return data;
};

const applyEdgeDetection = (
  data: number[],
  width: number,
  height: number,
  algorithm: EdgeDetectionAlgorithm
): number[] => {
  const output = new Array(data.length).fill(0);
  const kernels = {
    sobel: {
      x: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
      y: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
    },
    prewitt: {
      x: [-1, 0, 1, -1, 0, 1, -1, 0, 1],
      y: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
    },
    roberts: {
      x: [1, 0, 0, -1],
      y: [0, 1, -1, 0],
    },
  };

  const kernel = kernels[algorithm];
  const isRoberts = algorithm === "roberts";
  const kernelSize = isRoberts ? 2 : 3;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      // Apply kernel
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const pixel = ((y + ky - 1) * width + (x + kx - 1)) * 4;
          const kernelIndex = ky * kernelSize + kx;
          const value = (data[pixel] + data[pixel + 1] + data[pixel + 2]) / 3;

          gx += value * kernel.x[kernelIndex];
          gy += value * kernel.y[kernelIndex];
        }
      }

      // Calculate magnitude
      const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const pixel = (y * width + x) * 4;

      // Set pixel values
      output[pixel] = magnitude;
      output[pixel + 1] = magnitude;
      output[pixel + 2] = magnitude;
      output[pixel + 3] = 255;
    }
  }

  return output;
};

export const processImage = (
  data: number[],
  width: number,
  height: number,
  type: string,
  intensity: number = 0,
  algorithm?: EdgeDetectionAlgorithm
): {
  data: number[];
  width: number;
  height: number;
  originalImage: string;
} | null => {
  try {
    let processedData: number[];

    switch (type) {
      case "gri":
        processedData = data.map((value, index) => {
          if ((index + 1) % 4 === 0) return value; // Alpha channel
          const pixel = Math.floor(index / 4);
          const grayscale = Math.round(
            (data[pixel * 4] + data[pixel * 4 + 1] + data[pixel * 4 + 2]) / 3
          );
          return grayscale;
        });
        break;

      case "kenar":
        processedData = applyEdgeDetection(
          data,
          width,
          height,
          algorithm || "sobel"
        );
        break;

      case "parlaklik":
        processedData = data.map((value, index) => {
          if ((index + 1) % 4 === 0) return value; // Alpha channel
          return Math.min(255, Math.max(0, value + intensity * 255));
        });
        break;

      case "kontrast":
        const factor = (1 + intensity) ** 2;
        processedData = data.map((value, index) => {
          if ((index + 1) % 4 === 0) return value; // Alpha channel
          const normalized = value / 255;
          const contrasted = ((normalized - 0.5) * factor + 0.5) * 255;
          return Math.min(255, Math.max(0, contrasted));
        });
        break;

      case "bulanik":
        processedData = applyBlur(
          data,
          width,
          height,
          Math.max(1, intensity * 10)
        );
        break;

      default:
        return null;
    }

    // Convert processed data back to image
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const imageData = ctx.createImageData(width, height);
    processedData.forEach((value, index) => {
      imageData.data[index] = value;
    });
    ctx.putImageData(imageData, 0, 0);

    return {
      data: processedData,
      width,
      height,
      originalImage: canvas.toDataURL(),
    };
  } catch (error) {
    console.error("Image processing error:", error);
    return null;
  }
};
