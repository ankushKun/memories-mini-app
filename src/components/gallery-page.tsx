import React, { useState, useMemo, useCallback, useRef, useTransition, useEffect } from 'react'
import { useNavigate } from 'react-router'
import InfiniteCanvas, { type CanvasItem, type InfiniteCanvasRef } from './infinite-canvas'
import ImageModal from './image-modal'
import { generateInfiniteGrid, clearImageUrlCache } from '../utils/generate-grid'
import { useDebounce } from '../hooks/use-debounce'
import { useIsMobile } from '../hooks/use-mobile'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Home, Plus, User } from 'lucide-react'
import { useActiveAddress, useConnection, useProfileModal } from '@arweave-wallet-kit/react'

const query = `query {
    transactions(tags: [{name: "App-Name", values: ["Memories-App"]}]) {
    edges {
        cursor
        node {
            tags {
                name
                value
            }
        }
    }
    }
}`

const GalleryPage: React.FC = () => {
    const [itemCount, setItemCount] = useState(1000)
    const [isPending, startTransition] = useTransition()
    const [selectedImage, setSelectedImage] = useState<CanvasItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const canvasRef = useRef<InfiniteCanvasRef>(null)
    const isMobile = useIsMobile()
    const navigate = useNavigate()
    const address = useActiveAddress()
    const { connected } = useConnection()
    const { setOpen } = useProfileModal()

    // Debounce item count changes to prevent rapid re-computations
    const debouncedItemCount = useDebounce(itemCount, 300)

    // Generate items in grid layout
    const items: CanvasItem[] = useMemo(() => {
        console.log(`Generating ${debouncedItemCount} items for grid layout`)
        const size = isMobile ? 150 : 200
        const spacing = isMobile ? 10 : 20
        return generateInfiniteGrid(Math.ceil(Math.sqrt(debouncedItemCount)), size, spacing)
    }, [debouncedItemCount, isMobile])

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
        <div className="relative w-full h-screen bg-gradient-to-br from-black via-gray-900 to-black">
            {/* Header Controls */}
            <div className="absolute top-4 min-w-1/2 max-w-screen w-[90vw] md:w-fit left-1/2 transform -translate-x-1/2 z-10">
                <Card className="bg-black/20 backdrop-blur-md border-white/10 rounded-3xl p-0 py-3">
                    <CardContent className="p-0 px-4">
                        <div className="flex items-center justify-between">
                            {/* Left - Home Icon */}
                            <Button
                                onClick={handleBackToHome}
                                variant="ghost"
                                size="sm"
                                className="text-white/80 hover:text-white hover:bg-white/10 p-2"
                            >
                                <Home className="w-5 h-5" />
                            </Button>

                            {/* Center - Gallery Title */}
                            <div className="text-white font-semibold text-lg">
                                Gallery
                            </div>

                            {/* Right - Profile Icon */}
                            {connected ? (
                                <Button
                                    onClick={() => setOpen(true)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/80 hover:text-white hover:bg-white/10 p-2"
                                >
                                    <User className="w-5 h-5" />
                                </Button>
                            ) : (
                                <div className="w-9 h-9"></div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Infinite Canvas */}
            <InfiniteCanvas
                ref={canvasRef}
                items={items}
                itemSize={isMobile ? 150 : 200}
                gap={isMobile ? 10 : 20}
                isPending={isPending}
                onImageClick={handleImageClick}
            />

            {/* Floating Action Button */}
            <div className={`fixed z-20 ${isMobile ? 'bottom-40 right-4' : 'bottom-8 right-8'}`}>
                <div className="relative">
                    {/* Glow effect */}
                    <div className={`absolute inset-0 ${isMobile ? 'h-12' : 'h-14'} rounded-full bg-purple-500/30 blur-lg animate-pulse`}></div>

                    {/* Main button */}
                    <Button
                        onClick={handleBackToHome}
                        size={isMobile ? "default" : "lg"}
                        className={`relative ${isMobile ? 'h-12 px-4' : 'h-14 px-6'} rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white hover:bg-black/30 hover:border-white/30 shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 group`}
                    >
                        <Plus className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} transition-transform duration-200 group-hover:rotate-90 mr-2`} />
                        <span className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>add memory</span>
                    </Button>
                </div>
            </div>

            {/* Welcome Message */}
            <div className={`absolute ${isMobile ? 'bottom-4 left-4 right-4' : 'bottom-8 left-8 max-w-md'}`}>
                <Card className="bg-black/20 backdrop-blur-md border-white/10">
                    <CardContent className={isMobile ? "p-4" : "p-6"}>
                        <h2 className={`text-white font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                            Welcome to Memories Gallery
                        </h2>
                        <p className={`text-white/80 leading-relaxed ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            Explore an infinite canvas of memories. {isMobile ? 'Touch and drag to pan, pinch to zoom.' : 'Drag anywhere to pan around, scroll to navigate through the gallery.'}
                            Your memories are organized in a beautiful grid layout.
                        </p>
                    </CardContent>
                </Card>
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
