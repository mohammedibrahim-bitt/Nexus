export type CropArea = { height: number; width: number; x: number; y: number }

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', reject)
    image.crossOrigin = 'anonymous'
    image.src = src
  })

/**
 * Renders the user's crop selection (from react-easy-crop, in source-image
 * pixel coordinates) onto a fixed-size square canvas and returns it as a
 * JPEG blob ready to upload — the actual "save the crop" step.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  cropArea: CropArea,
  outputSize = 512,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    outputSize,
    outputSize,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not export cropped image'))),
      'image/jpeg',
      0.92,
    )
  })
}
