/**
 * Generates a polaroid-style image with "memories.ar.io" text at the bottom
 */
export const createPolaroidImage = (
    imageFile: File,
    options: {
        width?: number
        height?: number
        borderWidth?: number
        textHeight?: number
        backgroundColor?: string
        textColor?: string
        fontSize?: number
        fontFamily?: string
    } = {}
): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
        const {
            width = 400,
            height = 500,
            borderWidth = 20,
            textHeight = 80,
            backgroundColor = '#f8f8f8',
            textColor = '#333333',
            fontSize = 16,
            fontFamily = 'Arial, sans-serif'
        } = options

        // Create image element
        const img = new Image()
        img.onload = () => {
            try {
                // Create canvas
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                    reject(new Error('Could not get canvas context'))
                    return
                }

                // Set canvas dimensions
                canvas.width = width
                canvas.height = height

                // Fill background (polaroid border)
                ctx.fillStyle = backgroundColor
                ctx.fillRect(0, 0, width, height)

                // Calculate image area (excluding borders and text area)
                const imageAreaWidth = width - (borderWidth * 2)
                const imageAreaHeight = height - (borderWidth * 2) - textHeight
                const imageX = borderWidth
                const imageY = borderWidth

                // Calculate image scaling to fit within the image area while maintaining aspect ratio
                const imgAspectRatio = img.width / img.height
                const areaAspectRatio = imageAreaWidth / imageAreaHeight

                let drawWidth, drawHeight, drawX, drawY

                if (imgAspectRatio > areaAspectRatio) {
                    // Image is wider than area - fit to width
                    drawWidth = imageAreaWidth
                    drawHeight = imageAreaWidth / imgAspectRatio
                    drawX = imageX
                    drawY = imageY + (imageAreaHeight - drawHeight) / 2
                } else {
                    // Image is taller than area - fit to height
                    drawWidth = imageAreaHeight * imgAspectRatio
                    drawHeight = imageAreaHeight
                    drawX = imageX + (imageAreaWidth - drawWidth) / 2
                    drawY = imageY
                }

                // Draw the image
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

                // Add text at the bottom
                const textY = height - textHeight + (textHeight / 2)

                ctx.fillStyle = textColor
                ctx.font = `${fontSize}px ${fontFamily}`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'

                // Draw the text
                ctx.fillText('memories.ar.io', width / 2, textY)

                // Convert to blob and data URL
                canvas.toBlob((blob) => {
                    if (blob) {
                        const dataUrl = canvas.toDataURL('image/png')
                        resolve({ blob, dataUrl })
                    } else {
                        reject(new Error('Failed to create blob from canvas'))
                    }
                }, 'image/png', 0.9)
            } catch (error) {
                reject(error)
            }
        }

        img.onerror = () => {
            reject(new Error('Failed to load image'))
        }

        // Load the image
        const reader = new FileReader()
        reader.onload = (e) => {
            if (e.target?.result) {
                img.src = e.target.result as string
            } else {
                reject(new Error('Failed to read file'))
            }
        }
        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }
        reader.readAsDataURL(imageFile)
    })
}

/**
 * Creates a File object from a Blob with polaroid styling
 */
export const createPolaroidFile = async (
    originalFile: File,
    options?: Parameters<typeof createPolaroidImage>[1]
): Promise<File> => {
    const { blob } = await createPolaroidImage(originalFile, options)

    // Create a new File object with the polaroid blob
    const fileName = originalFile.name.replace(/\.[^/.]+$/, '_polaroid.png')
    return new File([blob], fileName, {
        type: 'image/png',
        lastModified: Date.now()
    })
}
