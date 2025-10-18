/**
 * Polaroid Image Generator Utility
 * Creates polaroid-style images with title and location text
 */

export interface PolaroidOptions {
    maxWidth?: number
    maxHeight?: number
    borderWidth?: number
    textHeight?: number
    fontSize?: number
    backgroundColor?: string
    textColor?: string
    isMobile?: boolean
    title?: string
    location?: string
    format?: 'jpeg' | 'png'
    quality?: number
}

/**
 * Creates a polaroid-style image from a file
 */
export const createPolaroidImage = (
    imageFile: File,
    options: PolaroidOptions = {}
): Promise<{ blob: Blob; dataUrl: string }> => {
    const {
        maxWidth = 600,
        maxHeight = 750,
        borderWidth = 25,
        textHeight = 90,
        fontSize = 18,
        backgroundColor = '#ffffff',
        textColor = '#333333',
        isMobile = false,
        title = '',
        location = '',
        format = 'png',
        quality = 0.92
    } = options

    return new Promise((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
        }

        img.onload = () => {
            try {
                // Calculate dimensions
                const imgAspectRatio = img.width / img.height
                let targetImageWidth = maxWidth - (borderWidth * 2)
                let targetImageHeight = maxHeight - (borderWidth * 2) - textHeight

                // Maintain aspect ratio
                if (targetImageWidth / targetImageHeight > imgAspectRatio) {
                    targetImageWidth = targetImageHeight * imgAspectRatio
                } else {
                    targetImageHeight = targetImageWidth / imgAspectRatio
                }

                const canvasWidth = targetImageWidth + (borderWidth * 2)
                const canvasHeight = targetImageHeight + (borderWidth * 2) + textHeight

                // Set canvas dimensions
                canvas.width = canvasWidth
                canvas.height = canvasHeight

                // Enable high-quality image rendering
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'

                // Fill background (polaroid border)
                ctx.fillStyle = backgroundColor
                ctx.fillRect(0, 0, canvasWidth, canvasHeight)

                // Calculate image position (centered in the image area)
                const imageX = borderWidth
                const imageY = borderWidth

                // Draw the image
                ctx.drawImage(img, imageX, imageY, targetImageWidth, targetImageHeight)

                // Add text at the bottom
                ctx.fillStyle = textColor
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'

                // Calculate text positions
                const textAreaTop = canvasHeight - textHeight
                const textAreaCenter = canvasWidth / 2
                let currentY = textAreaTop + 20 // Start with some padding

                // Draw title if provided
                if (title.trim()) {
                    ctx.font = `bold ${fontSize}px Arial, sans-serif`
                    ctx.fillText(title.trim(), textAreaCenter, currentY)
                    currentY += fontSize + 8
                }

                // Draw location if provided
                if (location.trim()) {
                    ctx.font = `${fontSize - 2}px Arial, sans-serif`
                    ctx.fillText(`📍 ${location.trim()}`, textAreaCenter, currentY)
                    currentY += fontSize + 8
                }

                // Draw branding
                const brandY = canvasHeight - 15
                ctx.font = `${fontSize - 6}px Arial, sans-serif`
                ctx.fillStyle = textColor + '80' // Semi-transparent
                ctx.fillText('memories.ar.io', textAreaCenter, brandY)

                // Convert to blob and data URL
                const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
                canvas.toBlob((blob) => {
                    if (blob) {
                        const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? quality : undefined)
                        resolve({ blob, dataUrl })
                    } else {
                        reject(new Error('Failed to create blob from canvas'))
                    }
                }, mimeType, format === 'jpeg' ? quality : undefined)
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
 * Creates a polaroid image from an image URL
 */
export const createPolaroidFromUrl = (
    imageUrl: string,
    title: string = '',
    location: string = '',
    options: Omit<PolaroidOptions, 'title' | 'location'> = {}
): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous' // Enable CORS for external images

        img.onload = () => {
            try {
                const {
                    maxWidth = 600,
                    maxHeight = 750,
                    borderWidth = 25,
                    textHeight = 90,
                    fontSize = 18,
                    backgroundColor = '#ffffff',
                    textColor = '#333333',
                    format = 'png',
                    quality = 0.92
                } = options

                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                    reject(new Error('Could not get canvas context'))
                    return
                }

                // Calculate dimensions
                const imgAspectRatio = img.width / img.height
                let targetImageWidth = maxWidth - (borderWidth * 2)
                let targetImageHeight = maxHeight - (borderWidth * 2) - textHeight

                // Maintain aspect ratio
                if (targetImageWidth / targetImageHeight > imgAspectRatio) {
                    targetImageWidth = targetImageHeight * imgAspectRatio
                } else {
                    targetImageHeight = targetImageWidth / imgAspectRatio
                }

                const canvasWidth = targetImageWidth + (borderWidth * 2)
                const canvasHeight = targetImageHeight + (borderWidth * 2) + textHeight

                // Set canvas dimensions
                canvas.width = canvasWidth
                canvas.height = canvasHeight

                // Enable high-quality image rendering
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'

                // Fill background (polaroid border)
                ctx.fillStyle = backgroundColor
                ctx.fillRect(0, 0, canvasWidth, canvasHeight)

                // Calculate image position (centered in the image area)
                const imageX = borderWidth
                const imageY = borderWidth

                // Draw the image
                ctx.drawImage(img, imageX, imageY, targetImageWidth, targetImageHeight)

                // Add text at the bottom
                ctx.fillStyle = textColor
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'

                // Calculate text positions
                const textAreaTop = canvasHeight - textHeight
                const textAreaCenter = canvasWidth / 2
                let currentY = textAreaTop + 20 // Start with some padding

                // Draw title if provided
                if (title.trim()) {
                    ctx.font = `bold ${fontSize}px Arial, sans-serif`
                    ctx.fillText(title.trim(), textAreaCenter, currentY)
                    currentY += fontSize + 8
                }

                // Draw location if provided
                if (location.trim()) {
                    ctx.font = `${fontSize - 2}px Arial, sans-serif`
                    ctx.fillText(`📍 ${location.trim()}`, textAreaCenter, currentY)
                    currentY += fontSize + 8
                }

                // Draw branding
                const brandY = canvasHeight - 15
                ctx.font = `${fontSize - 6}px Arial, sans-serif`
                ctx.fillStyle = textColor + '80' // Semi-transparent
                ctx.fillText('memories.ar.io', textAreaCenter, brandY)

                // Convert to blob and data URL
                const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
                canvas.toBlob((blob) => {
                    if (blob) {
                        const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? quality : undefined)
                        resolve({ blob, dataUrl })
                    } else {
                        reject(new Error('Failed to create blob from canvas'))
                    }
                }, mimeType, format === 'jpeg' ? quality : undefined)
            } catch (error) {
                reject(error)
            }
        }

        img.onerror = () => {
            reject(new Error('Failed to load image'))
        }

        img.src = imageUrl
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
