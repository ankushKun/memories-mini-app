/**
 * Helper function to wrap text to fit within a given width
 */
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = ctx.measureText(currentLine + ' ' + word).width
        if (width < maxWidth) {
            currentLine += ' ' + word
        } else {
            lines.push(currentLine)
            currentLine = word
        }
    }
    lines.push(currentLine)
    return lines
}

/**
 * Generates a polaroid-style image with "memories.ar.io" text at the bottom
 * Canvas size is dynamically calculated based on image dimensions and orientation
 */
export const createPolaroidImage = (
    imageFile: File,
    options: {
        maxWidth?: number
        maxHeight?: number
        borderWidth?: number
        textHeight?: number
        backgroundColor?: string
        textColor?: string
        fontSize?: number
        fontFamily?: string
        isMobile?: boolean
        title?: string
        location?: string
    } = {}
): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
        const {
            maxWidth = 600,
            maxHeight = 800,
            borderWidth = 20,
            textHeight = 80,
            backgroundColor = '#f8f8f8',
            textColor = '#333333',
            fontSize = 16,
            fontFamily = 'Arial, sans-serif',
            isMobile = false,
            title = '',
            location = ''
        } = options

        // Create image element
        const img = new Image()
        img.onload = () => {
            try {
                // Calculate responsive dimensions based on image aspect ratio
                const imgAspectRatio = img.width / img.height
                const isLandscape = imgAspectRatio > 1
                const isPortrait = imgAspectRatio < 1
                const isSquare = Math.abs(imgAspectRatio - 1) < 0.1

                // Adjust max dimensions for mobile
                const actualMaxWidth = isMobile ? Math.min(maxWidth, 400) : maxWidth
                const actualMaxHeight = isMobile ? Math.min(maxHeight, 600) : maxHeight
                const actualBorderWidth = isMobile ? Math.max(borderWidth * 0.75, 15) : borderWidth

                // Calculate text height based on content
                const hasTitle = title.trim().length > 0
                const hasLocation = location.trim().length > 0
                const textLines = 1 + (hasTitle ? 1 : 0) + (hasLocation ? 1 : 0) // Always include memories.ar.io
                const baseTextHeight = isMobile ? Math.max(textHeight * 0.75, 60) : textHeight
                const actualTextHeight = Math.max(baseTextHeight, textLines * 25 + 20) // 25px per line + padding

                const actualFontSize = isMobile ? Math.max(fontSize * 0.875, 14) : fontSize
                const titleFontSize = Math.max(actualFontSize + 2, 16)
                const locationFontSize = Math.max(actualFontSize - 1, 12)
                const brandFontSize = actualFontSize

                let targetImageWidth, targetImageHeight, canvasWidth, canvasHeight

                if (isLandscape) {
                    // For landscape images, prioritize width
                    targetImageWidth = Math.min(actualMaxWidth - (actualBorderWidth * 2), img.width * 0.8)
                    targetImageHeight = targetImageWidth / imgAspectRatio

                    // Ensure height doesn't exceed max
                    if (targetImageHeight > actualMaxHeight - (actualBorderWidth * 2) - actualTextHeight) {
                        targetImageHeight = actualMaxHeight - (actualBorderWidth * 2) - actualTextHeight
                        targetImageWidth = targetImageHeight * imgAspectRatio
                    }
                } else if (isPortrait) {
                    // For portrait images, prioritize height
                    targetImageHeight = Math.min(actualMaxHeight - (actualBorderWidth * 2) - actualTextHeight, img.height * 0.8)
                    targetImageWidth = targetImageHeight * imgAspectRatio

                    // Ensure width doesn't exceed max
                    if (targetImageWidth > actualMaxWidth - (actualBorderWidth * 2)) {
                        targetImageWidth = actualMaxWidth - (actualBorderWidth * 2)
                        targetImageHeight = targetImageWidth / imgAspectRatio
                    }
                } else {
                    // For square images, use balanced approach
                    const maxImageSize = Math.min(
                        actualMaxWidth - (actualBorderWidth * 2),
                        actualMaxHeight - (actualBorderWidth * 2) - actualTextHeight
                    )
                    targetImageWidth = targetImageHeight = Math.min(maxImageSize, Math.min(img.width, img.height) * 0.8)
                }

                // Calculate final canvas dimensions
                canvasWidth = targetImageWidth + (actualBorderWidth * 2)
                canvasHeight = targetImageHeight + (actualBorderWidth * 2) + actualTextHeight

                // Create canvas
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                    reject(new Error('Could not get canvas context'))
                    return
                }

                // Set canvas dimensions
                canvas.width = canvasWidth
                canvas.height = canvasHeight

                // Fill background (polaroid border)
                ctx.fillStyle = backgroundColor
                ctx.fillRect(0, 0, canvasWidth, canvasHeight)

                // Calculate image position (centered in the image area)
                const imageX = actualBorderWidth
                const imageY = actualBorderWidth

                // Draw the image
                ctx.drawImage(img, imageX, imageY, targetImageWidth, targetImageHeight)

                // Add text at the bottom
                ctx.fillStyle = textColor
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'

                // Calculate text positions
                const textAreaTop = canvasHeight - actualTextHeight
                const textAreaCenter = canvasWidth / 2
                let currentY = textAreaTop + 20 // Start with some padding

                // Draw title if provided
                if (hasTitle) {
                    ctx.font = `bold ${titleFontSize}px ${fontFamily}`
                    const titleText = title.trim()

                    // Handle long titles by wrapping text
                    const maxTitleWidth = canvasWidth - (actualBorderWidth * 2)
                    const titleLines = wrapText(ctx, titleText, maxTitleWidth)

                    titleLines.forEach((line, index) => {
                        ctx.fillText(line, textAreaCenter, currentY + (index * (titleFontSize + 2)))
                    })
                    currentY += titleLines.length * (titleFontSize + 2) + 8
                }

                // Draw location if provided
                if (hasLocation) {
                    ctx.font = `${locationFontSize}px ${fontFamily}`
                    const locationText = `📍 ${location.trim()}`

                    // Handle long locations by wrapping text
                    const maxLocationWidth = canvasWidth - (actualBorderWidth * 2)
                    const locationLines = wrapText(ctx, locationText, maxLocationWidth)

                    locationLines.forEach((line, index) => {
                        ctx.fillText(line, textAreaCenter, currentY + (index * (locationFontSize + 2)))
                    })
                    currentY += locationLines.length * (locationFontSize + 2) + 8
                }

                // Draw brand text (memories.ar.io)
                ctx.font = `${brandFontSize}px ${fontFamily}`
                ctx.fillStyle = textColor + '99' // Slightly transparent
                const brandY = canvasHeight - 15 // Always at the bottom
                ctx.fillText('memories.ar.io', textAreaCenter, brandY)

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
