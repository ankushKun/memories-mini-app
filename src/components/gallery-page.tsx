import React, { useState, useMemo, useCallback, useRef, useTransition, useEffect } from 'react'
import { useNavigate } from 'react-router'
import InfiniteCanvas, { type CanvasItem, type InfiniteCanvasRef } from './infinite-canvas'
import ImageModal from './image-modal'
import ListViewComponent from './list-view'
import { clearImageUrlCache } from '../utils/generate-grid'
import { useIsMobile } from '../hooks/use-mobile'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Home, Plus, User, RefreshCw, Upload, LayoutGrid, List, LayoutList } from 'lucide-react'
import { useActiveAddress, useConnection, useProfileModal } from '@arweave-wallet-kit/react'
import { MemoriesLogo } from './landing-page'

// GraphQL query for fetching Arweave transactions
const MEMORIES_QUERY = `query GetMemories($after: String) {
    transactions(
        tags: [
            {name: "App-Name", values: ["Memories-App"]}
            {name: "App-Version", values: ["1.0.1"]}
        ],
        after: $after
        first: 20
    ) {
        edges {
            cursor
            node {
                id
                tags {
                    name
                    value
                }
            }
        }
    }
}`

// Interface for GraphQL response
interface ArweaveTransaction {
    id: string
    tags: Array<{
        name: string
        value: string
    }>
}

interface TransactionEdge {
    cursor: string
    node: ArweaveTransaction
}

interface GraphQLResponse {
    data: {
        transactions: {
            edges: TransactionEdge[]
        }
    }
}

// Function to fetch memories from Arweave
const fetchMemories = async (cursor?: string): Promise<GraphQLResponse> => {
    const response = await fetch('https://arweave.net/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: MEMORIES_QUERY,
            variables: cursor ? { after: cursor } : {}
        })
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
}

// Create a map to store real Arweave images
const arweaveImageMap = new Map<string, { url: string; title: string; location?: string }>()

// Function to check if a URL is a valid image
const isValidImageUrl = async (url: string): Promise<boolean> => {
    try {
        const response = await fetch(url, { method: 'HEAD' })
        const contentType = response.headers.get('content-type')
        return contentType ? contentType.startsWith('image/') : false
    } catch {
        return false
    }
}

const GalleryPage: React.FC = () => {
    const [arweaveMemories, setArweaveMemories] = useState<ArweaveTransaction[]>([])
    const [validatedImages, setValidatedImages] = useState<Set<string>>(new Set())
    const [isLoadingArweave, setIsLoadingArweave] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [endCursor, setEndCursor] = useState<string | null>(null)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [selectedImage, setSelectedImage] = useState<CanvasItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'card'>('grid')
    const canvasRef = useRef<InfiniteCanvasRef>(null)
    const isMobile = useIsMobile()
    const navigate = useNavigate()
    const address = useActiveAddress()
    const { connected } = useConnection()
    const { setOpen } = useProfileModal()

    // Load Arweave memories
    const loadArweaveMemories = useCallback(async (cursor?: string, append = false) => {
        try {
            if (!append) {
                setIsLoadingArweave(true)
                setError(null)
            } else {
                setIsLoadingMore(true)
            }

            const response = await fetchMemories(cursor)
            const transactions = response.data.transactions.edges.map(edge => edge.node)

            if (append) {
                setArweaveMemories(prev => [...prev, ...transactions])
            } else {
                setArweaveMemories(transactions)
            }

            // Filter and validate image transactions
            const imageValidationPromises = transactions.map(async (transaction, index) => {
                const tags = transaction.tags.reduce((acc, tag) => {
                    acc[tag.name] = tag.value
                    return acc
                }, {} as Record<string, string>)

                // Check if Content-Type tag indicates it's an image
                const contentType = tags['Content-Type']
                const isImageContentType = contentType && contentType.startsWith('image/')

                if (isImageContentType) {
                    const url = `https://arweave.net/${transaction.id}`

                    // Double-check by validating the actual URL
                    const isValidImage = await isValidImageUrl(url)

                    if (isValidImage) {
                        arweaveImageMap.set(transaction.id, {
                            url,
                            title: tags.Title || tags.Name || `Memory ${arweaveMemories.length + index + 1}`,
                            location: tags.Location
                        })
                        return transaction.id
                    }
                }
                return null
            })

            // Wait for all validations to complete
            const validImageIds = await Promise.all(imageValidationPromises)
            const validIds = validImageIds.filter(id => id !== null) as string[]

            // Update validated images set
            setValidatedImages(prev => {
                const newSet = new Set(prev)
                validIds.forEach(id => newSet.add(id))
                return newSet
            })

            // Set hasNextPage based on whether we got the full requested amount (20)
            setHasNextPage(response.data.transactions.edges.length === 20)

            // Set endCursor to the cursor of the last transaction
            if (response.data.transactions.edges.length > 0) {
                setEndCursor(response.data.transactions.edges[response.data.transactions.edges.length - 1].cursor)
            } else {
                setEndCursor(null)
            }

        } catch (err) {
            console.error('Failed to load Arweave memories:', err)
            setError(err instanceof Error ? err.message : 'Failed to load Arweave memories')
        } finally {
            setIsLoadingArweave(false)
            setIsLoadingMore(false)
        }
    }, [])

    // Load more memories (pagination)
    const loadMoreMemories = useCallback(() => {
        if (hasNextPage && !isLoadingMore && endCursor) {
            loadArweaveMemories(endCursor, true)
        }
    }, [hasNextPage, isLoadingMore, endCursor, loadArweaveMemories])

    // Refresh memories
    const refreshMemories = useCallback(() => {
        setArweaveMemories([])
        setEndCursor(null)
        arweaveImageMap.clear()
        loadArweaveMemories()
    }, [loadArweaveMemories])

    // Generate items in grid layout with only validated image URLs
    const items: CanvasItem[] = useMemo(() => {
        const validImageCount = arweaveImageMap.size
        console.log(`Generating grid layout for ${validImageCount} validated images`)
        const size = isMobile ? 150 : 200
        const spacing = isMobile ? 10 : 20

        // Calculate grid dimensions based on number of validated images
        if (validImageCount === 0) return []

        const itemsPerRow = Math.ceil(Math.sqrt(validImageCount))

        // Convert only validated Arweave images to CanvasItems with proper grid positioning
        const arweaveArray = Array.from(arweaveImageMap.entries())
        return arweaveArray.map(([transactionId, arweaveData], index) => {
            const row = Math.floor(index / itemsPerRow)
            const col = index % itemsPerRow
            const x = col * (size + spacing)
            const y = row * (size + spacing)

            return {
                id: transactionId,
                x,
                y,
                width: size,
                height: size,
                imageUrl: arweaveData.url,
                title: arweaveData.title,
                metadata: {
                    location: arweaveData.location,
                    date: new Date(),
                    description: `A memory stored on Arweave`,
                    tags: [],
                    camera: undefined
                }
            }
        })
    }, [isMobile, validatedImages])

    // Load initial data
    useEffect(() => {
        loadArweaveMemories()
    }, [loadArweaveMemories])

    // Cleanup effect for memory management
    useEffect(() => {
        return () => {
            // Clear image URL cache when component unmounts
            clearImageUrlCache()
        }
    }, [])



    // Memoized reset function
    const resetView = useCallback(() => {
        if (canvasRef.current) {
            canvasRef.current.resetView()
        } else {
            // Fallback to reload if ref method not available
            window.location.reload()
        }
    }, [])

    // Handle image click to open modal
    const handleImageClick = useCallback((item: CanvasItem) => {
        // Reset canvas dragging state when opening modal
        if (canvasRef.current) {
            canvasRef.current.resetDragState()
        }
        setSelectedImage(item)
        setIsModalOpen(true)
    }, [])

    // Handle modal close
    const handleModalClose = useCallback(() => {
        setIsModalOpen(false)
        setSelectedImage(null)
    }, [])

    // Handle navigation to landing page
    const handleBackToHome = useCallback(() => {
        navigate('/')
    }, [navigate])

    return (
        <div className="relative w-full h-screen bg-black">
            <div className='absolute top-10 left-10 z-40'>
                <MemoriesLogo theme='light' />
            </div>

            {/* Loading State */}
            {isLoadingArweave && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="text-white text-lg font-medium">Loading memories...</div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !isLoadingArweave && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center max-w-md mx-4">
                        <div className="text-red-400 text-lg font-medium mb-4">Failed to load memories</div>
                        <div className="text-white/80 text-sm mb-6">{error}</div>
                        <Button onClick={refreshMemories} className="bg-white/20 hover:bg-white/30">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoadingArweave && !error && arweaveImageMap.size === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center max-w-md mx-4">
                        <div className="text-white/60 text-6xl mb-6">📸</div>
                        <div className="text-white text-xl font-medium mb-4">No image memories found</div>
                        <div className="text-white/70 text-sm mb-6">
                            Upload some image memories to see them here in your gallery.
                        </div>
                        <Button
                            onClick={() => navigate('/')}
                            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Upload Image Memory
                        </Button>
                    </div>
                </div>
            )}

            {/* Infinite Canvas - Grid View */}
            {arweaveImageMap.size > 0 && viewMode === 'grid' && (
                <InfiniteCanvas
                    ref={canvasRef}
                    items={items}
                    itemSize={isMobile ? 150 : 200}
                    gap={isMobile ? 20 : 40}
                    isPending={isPending}
                    onImageClick={handleImageClick}
                />
            )}

            {/* List View */}
            {arweaveImageMap.size > 0 && viewMode === 'list' && (
                <div className="absolute inset-0 pt-24 z-10">
                    <ListViewComponent
                        items={items}
                        onImageClick={handleImageClick}
                    />
                </div>
            )}

            {/* Floating Action Button */}
            <div className={`fixed z-20 top-10 right-10`}>
                <Button
                    className="bg-[#000DFF] text-white border border-[#2C2C2C] px-6 py-3 text-base font-medium rounded-md flex items-center gap-2"
                    variant="ghost"
                    onClick={handleBackToHome}
                >
                    <Upload className="w-4 h-4" />
                    Upload Now
                </Button>
            </div>

            <div className={`fixed z-20 bottom-10 right-10`}>
                {/* button group- grid, list, card */}
                <div className="inline-flex items-center gap-0 bg-white/10 backdrop-blur-md rounded p-1">
                    <Button
                        variant="ghost"
                        onClick={() => setViewMode('grid')}
                        className={`h-10 px-6 rounded text-sm font-medium transition-all ${viewMode === 'grid'
                            ? 'bg-white text-black hover:bg-white'
                            : 'text-white/70 hover:text-white hover:bg-transparent'
                            }`}
                        title="Grid View"
                    >
                        Grid
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setViewMode('list')}
                        className={`h-10 px-6 rounded text-sm font-medium transition-all ${viewMode === 'list'
                            ? 'bg-white text-black hover:bg-white'
                            : 'text-white/70 hover:text-white hover:bg-transparent'
                            }`}
                        title="List View"
                    >
                        List
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setViewMode('card')}
                        className={`h-10 px-6 rounded text-sm font-medium transition-all ${viewMode === 'card'
                            ? 'bg-white text-black hover:bg-white'
                            : 'text-white/70 hover:text-white hover:bg-transparent'
                            }`}
                        title="Card View"
                    >
                        Card
                    </Button>
                </div>
            </div>



            {/* Image Modal */}
            <ImageModal
                item={selectedImage}
                isOpen={isModalOpen}
                onClose={handleModalClose}
            />

        </div >
    )
}

export default GalleryPage
