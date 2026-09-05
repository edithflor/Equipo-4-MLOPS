export function displayToImageBox(box, imageMetrics) {
  const scaleX = imageMetrics.naturalWidth / imageMetrics.displayWidth;
  const scaleY = imageMetrics.naturalHeight / imageMetrics.displayHeight;

  return {
    x: box.x * scaleX,
    y: box.y * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY,
  };
}

export function imageToDisplayBox(box, imageMetrics) {
  const scaleX = imageMetrics.displayWidth / imageMetrics.naturalWidth;
  const scaleY = imageMetrics.displayHeight / imageMetrics.naturalHeight;

  return {
    x: box.x * scaleX,
    y: box.y * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY,
  };
}
