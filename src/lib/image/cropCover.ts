function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function buildCroppedCover(
  file: File,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("이미지 로드에 실패했습니다."));
      img.src = objectUrl;
    });

    const sourceW = image.naturalWidth;
    const sourceH = image.naturalHeight;
    const base = Math.min(sourceW, sourceH);
    const cropSize = base / zoom;

    const maxShiftX = (sourceW - cropSize) / 2;
    const maxShiftY = (sourceH - cropSize) / 2;

    const centerX = sourceW / 2 + (offsetX / 100) * maxShiftX;
    const centerY = sourceH / 2 + (offsetY / 100) * maxShiftY;

    const sx = clamp(centerX - cropSize / 2, 0, sourceW - cropSize);
    const sy = clamp(centerY - cropSize / 2, 0, sourceH - cropSize);

    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이미지 처리 컨텍스트를 생성할 수 없습니다.");

    ctx.drawImage(
      image,
      sx,
      sy,
      cropSize,
      cropSize,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error("크롭 이미지 생성에 실패했습니다."));
          return;
        }
        resolve(result);
      }, "image/jpeg", 0.92);
    });

    return new File([blob], `cover-${Date.now()}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
