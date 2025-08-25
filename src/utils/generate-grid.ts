interface GridItem {
    id: string
    x: number
    y: number
    width: number
    height: number
    imageUrl: string
    title?: string
    metadata?: {
        date?: Date
        location?: string
        camera?: string
        tags?: string[]
        description?: string
    }
}

// Optimized image URL generation with caching
const imageUrlCache = new Map<string, string>()

const generateImageUrl = (index: number, width: number, height: number): string => {
    const cacheKey = `${index}-${width}-${height}`

    if (imageUrlCache.has(cacheKey)) {
        return imageUrlCache.get(cacheKey)!
    }

    const services = [
        // Picsum for beautiful photos
        `https://picsum.photos/${width}/${height}?random=${index}`,
        // Placeholder with different colors
        `https://via.placeholder.com/${width}x${height}/FF6B6B/FFFFFF?text=Image+${index}`,
        `https://via.placeholder.com/${width}x${height}/4ECDC4/FFFFFF?text=Art+${index}`,
        `https://via.placeholder.com/${width}x${height}/45B7D1/FFFFFF?text=Photo+${index}`,
        `https://via.placeholder.com/${width}x${height}/96CEB4/FFFFFF?text=Pic+${index}`,
        `https://via.placeholder.com/${width}x${height}/FFEAA7/333333?text=Gallery+${index}`,
        `https://via.placeholder.com/${width}x${height}/DDA0DD/FFFFFF?text=Memory+${index}`,
        `https://via.placeholder.com/${width}x${height}/98D8C8/FFFFFF?text=Item+${index}`
    ]

    // Use picsum for most images, placeholders for variety
    const url = index % 3 === 0
        ? services[0] // Picsum
        : services[1 + (index % (services.length - 1))]

    imageUrlCache.set(cacheKey, url)
    return url
}

// Generate metadata for images
const generateMetadata = (index: number) => {
    const locations = [
        'Paris, France', 'Tokyo, Japan', 'New York, USA', 'London, UK', 'Sydney, Australia',
        'Barcelona, Spain', 'Rome, Italy', 'Amsterdam, Netherlands', 'Prague, Czech Republic',
        'Santorini, Greece', 'Bali, Indonesia', 'Kyoto, Japan', 'Reykjavik, Iceland'
    ]

    const cameras = [
        'iPhone 15 Pro', 'Canon EOS R5', 'Sony A7R IV', 'Nikon D850', 'Fujifilm X-T5',
        'Leica Q2', 'Canon 5D Mark IV', 'Sony A7 III', 'Nikon Z9', 'Olympus OM-1'
    ]

    const tagSets = [
        ['travel', 'adventure', 'wanderlust'],
        ['nature', 'landscape', 'peaceful'],
        ['portrait', 'people', 'candid'],
        ['architecture', 'urban', 'modern'],
        ['street', 'city', 'life'],
        ['sunset', 'golden hour', 'beautiful'],
        ['food', 'delicious', 'culture'],
        ['friends', 'memories', 'joy'],
        ['art', 'creative', 'inspiration'],
        ['vintage', 'classic', 'timeless']
    ]

    const descriptions = [
        'A beautiful moment captured in time, showcasing the perfect blend of light and composition.',
        'This image holds special memories from an amazing day filled with joy and laughter.',
        'An artistic capture that tells a story of adventure and discovery.',
        'A candid moment that perfectly encapsulates the essence of the experience.',
        'This photograph represents a milestone in my journey as a photographer.',
        'Captured during golden hour, this image radiates warmth and tranquility.',
        'A spontaneous shot that turned into one of my favorite memories.',
        'The perfect composition came together naturally in this magical moment.',
        'This scene reminded me why I love exploring new places and cultures.',
        'A timeless capture that brings back wonderful memories every time I see it.'
    ]

    return {
        date: new Date(2024 - Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        location: locations[index % locations.length],
        camera: cameras[index % cameras.length],
        tags: tagSets[index % tagSets.length],
        description: descriptions[index % descriptions.length]
    }
}

export const generateInfiniteGrid = (
    gridSize: number = 50,
    itemSize: number = 200,
    gap: number = 20
): GridItem[] => {
    const items: GridItem[] = []
    const itemsPerRow = gridSize
    const itemsPerCol = gridSize

    for (let row = 0; row < itemsPerCol; row++) {
        for (let col = 0; col < itemsPerRow; col++) {
            const index = row * itemsPerRow + col
            const x = col * (itemSize + gap)
            const y = row * (itemSize + gap)

            // Use consistent size for proper grid alignment
            const width = itemSize
            const height = itemSize

            items.push({
                id: `item-${index}`,
                x,
                y,
                width,
                height,
                imageUrl: generateImageUrl(index, width, height),
                title: `Memory ${index + 1}`,
                metadata: generateMetadata(index)
            })
        }
    }

    return items
}

// Generate a more artistic scattered layout
export const generateScatteredGrid = (
    itemCount: number = 1000,
    itemSize: number = 200,
    canvasWidth: number = 10000,
    canvasHeight: number = 10000
): GridItem[] => {
    const items: GridItem[] = []

    for (let i = 0; i < itemCount; i++) {
        // Random position within canvas bounds
        const x = Math.random() * (canvasWidth - itemSize)
        const y = Math.random() * (canvasHeight - itemSize)

        // Varied sizes for more organic feel
        const sizeVariation = 0.6 + Math.random() * 0.8 // 0.6x to 1.4x
        const width = Math.round(itemSize * sizeVariation)
        const height = Math.round(itemSize * sizeVariation)

        items.push({
            id: `scattered-${i}`,
            x,
            y,
            width,
            height,
            imageUrl: generateImageUrl(i, width, height),
            title: `Memory ${i + 1}`,
            metadata: generateMetadata(i)
        })
    }

    return items
}

// Generate a spiral pattern
export const generateSpiralGrid = (
    itemCount: number = 500,
    itemSize: number = 200,
    gap: number = 20
): GridItem[] => {
    const items: GridItem[] = []
    const center = { x: 0, y: 0 }

    for (let i = 0; i < itemCount; i++) {
        const angle = i * 0.5 // Spiral angle
        const radius = i * 8 // Increasing radius

        const x = center.x + Math.cos(angle) * radius
        const y = center.y + Math.sin(angle) * radius

        // Use consistent size for better organization
        const width = itemSize
        const height = itemSize

        items.push({
            id: `spiral-${i}`,
            x,
            y,
            width,
            height,
            imageUrl: generateImageUrl(i, width, height),
            title: `Spiral Memory ${i + 1}`,
            metadata: generateMetadata(i)
        })
    }

    return items
}

// Utility function to clear cache when needed (for memory management)
export const clearImageUrlCache = (): void => {
    imageUrlCache.clear()
}

// Get cache size for debugging
export const getImageUrlCacheSize = (): number => {
    return imageUrlCache.size
}

