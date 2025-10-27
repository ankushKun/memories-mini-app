import React, { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import StampPreview from './stamp-preview'
import { Dialog, DialogContent } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import type { CanvasItem } from './infinite-canvas'

interface ListViewProps {
    items: CanvasItem[]
    onImageClick?: (item: CanvasItem) => void
}

const ListViewComponent: React.FC<ListViewProps> = ({ items, onImageClick }) => {
    const [selectedItem, setSelectedItem] = useState<CanvasItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const isMobile = useIsMobile()

    // Auto-select first item on desktop
    useEffect(() => {
        if (!isMobile && items.length > 0 && !selectedItem) {
            setSelectedItem(items[0])
        }
    }, [items, isMobile, selectedItem])

    const handleItemClick = (item: CanvasItem) => {
        if (isMobile) {
            setSelectedItem(item)
            setIsModalOpen(true)
        } else {
            setSelectedItem(item)
        }
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
    }

    // Function to get the index of current item
    const getCurrentIndex = () => {
        if (!selectedItem) return -1
        return items.findIndex(item => item.id === selectedItem.id)
    }

    // Function to navigate to previous item
    const handlePrevious = () => {
        const currentIndex = getCurrentIndex()
        if (currentIndex > 0) {
            setSelectedItem(items[currentIndex - 1])
        }
    }

    // Function to navigate to next item
    const handleNext = () => {
        const currentIndex = getCurrentIndex()
        if (currentIndex < items.length - 1) {
            setSelectedItem(items[currentIndex + 1])
        }
    }

    const currentIndex = getCurrentIndex()
    const hasPrevious = currentIndex > 0
    const hasNext = currentIndex < items.length - 1

    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-white/60">
                No memories to display
            </div>
        )
    }

    return (
        <>
            <div className="flex h-full w-full bg-black">
                {/* List Section */}
                <div className={cn(
                    "relative",
                    isMobile ? "w-full" : "w-1/2 max-w-1/2"
                )}>
                    {/* Top blur fade */}
                    <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />

                    <ScrollArea className="h-full p-0">
                        <div className="space-y-2 p-1 md:px-16 tracking-[5px]">
                            {items.map((item, index) => {
                                const isSelected = selectedItem?.id === item.id
                                const headline = item.title || `Memory ${index + 1}`
                                const location = item.metadata?.location || 'Unknown location'
                                const date = item.metadata?.date
                                    ? new Date(item.metadata.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })
                                    : 'Unknown date'

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleItemClick(item)}
                                        className={cn(
                                            "w-full text-left p-4 transition-all duration-200",
                                            "hover:bg-white/5 active:bg-white/10"
                                        )}
                                    >
                                        <div className="flex items-start gap-4">

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className={cn(
                                                    "text-white font-medium text-6xl font-instrument truncate mb-1",
                                                    isSelected && "text-white"
                                                )}>
                                                    {headline}
                                                </h3>
                                            </div>

                                            {/* Selection indicator */}
                                            {isSelected && (
                                                <div className="flex-shrink-0">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </ScrollArea>

                    {/* Bottom blur fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
                </div>

                {/* Preview Section - Desktop Only */}
                {!isMobile && selectedItem && (
                    <div className="flex-1 flex items-center justify-center p-8 relative">
                        <div className="max-w-2xl w-full">
                            <StampPreview
                                className='relative bottom-5'
                                headline={selectedItem.title || 'Untitled Memory'}
                                location={selectedItem.metadata?.location || 'Unknown location'}
                                handle="@memories"
                                date={selectedItem.metadata?.date
                                    ? new Date(selectedItem.metadata.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })
                                    : new Date().toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })
                                }
                                imageSrc={selectedItem.imageUrl}
                                layout="vertical"
                            />
                        </div>

                        {/* Fixed Navigation Buttons - Right Side */}
                        <div className="fixed right-8 top-0 bottom-0 flex flex-col justify-center gap-10 py-8 z-20">
                            {/* Top - Previous Button */}
                            <button
                                onClick={handlePrevious}
                                disabled={!hasPrevious}
                                className={cn(
                                    "p-4 rounded-full transition-all",
                                    hasPrevious
                                        ? "bg-white/10 hover:bg-white/20 text-white"
                                        : "bg-white/5 text-white/30 cursor-not-allowed"
                                )}
                                title="Previous"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>

                            {/* Bottom - Next Button */}
                            <button
                                onClick={handleNext}
                                disabled={!hasNext}
                                className={cn(
                                    "p-4 rounded-full transition-all",
                                    hasNext
                                        ? "bg-white/10 hover:bg-white/20 text-white"
                                        : "bg-white/5 text-white/30 cursor-not-allowed"
                                )}
                                title="Next"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Preview Modal */}
            {isMobile && selectedItem && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-[95vw] max-h-[90vh] bg-black border-white/20 p-6">
                        <div className="flex flex-col items-center">
                            <StampPreview
                                headline={selectedItem.title || 'Untitled Memory'}
                                location={selectedItem.metadata?.location || 'Unknown location'}
                                handle="@memories"
                                date={selectedItem.metadata?.date
                                    ? new Date(selectedItem.metadata.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })
                                    : new Date().toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })
                                }
                                imageSrc={selectedItem.imageUrl}
                                layout="vertical"
                                className="w-full"
                            />

                            {/* Navigation arrows for mobile */}
                            <div className="flex items-center justify-center gap-4 mt-6 w-full">
                                <button
                                    onClick={handlePrevious}
                                    disabled={!hasPrevious}
                                    className={cn(
                                        "p-3 rounded-full transition-all",
                                        hasPrevious
                                            ? "bg-white/10 hover:bg-white/20 text-white"
                                            : "bg-white/5 text-white/30 cursor-not-allowed"
                                    )}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <div className="text-white/60 text-sm">
                                    {currentIndex + 1} / {items.length}
                                </div>

                                <button
                                    onClick={handleNext}
                                    disabled={!hasNext}
                                    className={cn(
                                        "p-3 rounded-full transition-all",
                                        hasNext
                                            ? "bg-white/10 hover:bg-white/20 text-white"
                                            : "bg-white/5 text-white/30 cursor-not-allowed"
                                    )}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}

export default ListViewComponent

