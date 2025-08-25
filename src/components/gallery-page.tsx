import React, { useState, useMemo, useCallback, useRef, useTransition, useEffect } from 'react'
import InfiniteCanvas, { type CanvasItem, type InfiniteCanvasRef } from './infinite-canvas'
import ImageModal from './image-modal'
import { generateInfiniteGrid, clearImageUrlCache } from '../utils/generate-grid'
import { useDebounce } from '../hooks/use-debounce'
import { useIsMobile } from '../hooks/use-mobile'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { RotateCcw } from 'lucide-react'



const GalleryPage: React.FC = () => {
    const [itemCount, setItemCount] = useState(1000)
    const [isPending, startTransition] = useTransition()
    const [selectedImage, setSelectedImage] = useState<CanvasItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const canvasRef = useRef<InfiniteCanvasRef>(null)
    const isMobile = useIsMobile()

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

    return (
        <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header Controls */}
            <div className={`absolute top-4 z-10 ${isMobile ? 'left-4 right-4' : 'left-1/2 transform -translate-x-1/2'}`}>
                <Card className="bg-black/20 backdrop-blur-md border-white/10 p-2">
                    <CardContent className="p-4 py-0">
                        <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'gap-4'}`}>
                            <div className={`text-white font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                                Memories Gallery
                            </div>

                            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
                                <Button
                                    variant="outline"
                                    size={isMobile ? "sm" : "sm"}
                                    onClick={resetView}
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    {isMobile ? 'center' : 'center view'}
                                </Button>

                                <div className={`text-white/70 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                    {isPending ? 'Loading...' : `${items.length} items`}
                                </div>
                            </div>
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
        </div>
    )
}

export default GalleryPage
