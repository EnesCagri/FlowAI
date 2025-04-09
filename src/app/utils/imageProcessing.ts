export const processImage = (
  imageData: number[],
  width: number,
  height: number,
  type: string,
  intensity?: number
) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const newImageData = ctx.createImageData(width, height);
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];

    switch (type) {
      case "gri": {
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        data[i + 3] = a;
        break;
      }
      case "parlaklik": {
        const factor = (intensity ?? 0) / 100;
        data[i] = Math.min(255, Math.max(0, r + 255 * factor));
        data[i + 1] = Math.min(255, Math.max(0, g + 255 * factor));
        data[i + 2] = Math.min(255, Math.max(0, b + 255 * factor));
        data[i + 3] = a;
        break;
      }
      case "kontrast": {
        const factor = 1 + (intensity ?? 0) / 100;
        const intercept = 128 * (1 - factor);
        data[i] = Math.min(255, Math.max(0, factor * r + intercept));
        data[i + 1] = Math.min(255, Math.max(0, factor * g + intercept));
        data[i + 2] = Math.min(255, Math.max(0, factor * b + intercept));
        data[i + 3] = a;
        break;
      }
      case "bulanik": {
        const blurSize = Math.max(1, Math.floor((intensity ?? 0) / 10));
        let rSum = 0,
          gSum = 0,
          bSum = 0;
        let count = 0;

        const x = (i / 4) % width;
        const y = Math.floor(i / 4 / width);

        for (let dy = -blurSize; dy <= blurSize; dy++) {
          for (let dx = -blurSize; dx <= blurSize; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const idx = (ny * width + nx) * 4;
              rSum += imageData[idx];
              gSum += imageData[idx + 1];
              bSum += imageData[idx + 2];
              count++;
            }
          }
        }

        data[i] = rSum / count;
        data[i + 1] = gSum / count;
        data[i + 2] = bSum / count;
        data[i + 3] = a;
        break;
      }
    }
  }

  newImageData.data.set(data);
  ctx.putImageData(newImageData, 0, 0);
  return {
    width,
    height,
    data: Array.from(data),
    originalImage: canvas.toDataURL(),
  };
};
