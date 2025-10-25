import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/button'
import { useIsMobile } from '../hooks/use-mobile'
import type { CanvasItem } from './infinite-canvas'
import StampPreview from './stamp-preview'

interface ImageModalProps {
    item: CanvasItem | null
    isOpen: boolean
    onClose: () => void
}

const ImageModal: React.FC<ImageModalProps> = ({ item, isOpen, onClose }) => {
    const isMobile = useIsMobile()
    const [isAnimating, setIsAnimating] = useState(false)
    const [shouldRender, setShouldRender] = useState(false)

    // Handle animation states
    useEffect(() => {
        if (isOpen && item) {
            // Reset animation state first when switching items
            setIsAnimating(false)
            setShouldRender(true)

            // Small delay to trigger animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsAnimating(true)
                })
            })
        } else {
            setIsAnimating(false)
            // Wait for animation to complete before unmounting
            const timer = setTimeout(() => {
                setShouldRender(false)
            }, 300) // Match transition duration
            return () => clearTimeout(timer)
        }
    }, [isOpen, item?.id])

    if (!shouldRender || !item) return null

    // Use metadata from the item, with fallbacks
    const details = {
        date: item.metadata?.date || new Date(),
        location: item.metadata?.location || 'Unknown Location',
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 transition-all duration-300 ease-out ${isAnimating
                ? 'bg-black/90 backdrop-blur-md'
                : 'bg-black/0 backdrop-blur-none'
                }`}
            onClick={handleBackdropClick}
        >
            {/* Close button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className={`absolute top-6 right-6 z-10 bg-black/60 hover:bg-black/80 text-white border-white/20 rounded-full w-12 h-12 p-0 transition-all duration-300 ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                    }`}
            >
                <X className="w-6 h-6" />
            </Button>

            {/* Stamp Preview - centered with animation */}
            <div
                className={`flex items-center w-full h-full justify-center transition-all duration-300 ease-out ${isMobile ? 'w-80' : 'w-[600px]'
                    } ${isAnimating
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-90 translate-y-4'
                    }`}
            >
                <StampPreview
                    headline={item.title || 'Memory'}
                    location={details.location?.toUpperCase() || 'UNKNOWN LOCATION'}
                    handle="@memories"
                    date={details.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }).toUpperCase()}
                    imageSrc={item.imageUrl}
                    layout="vertical"
                    className='w-full h-fit'
                />
                <Button className='absolute bottom-0 left-0'>Share</Button>
            </div>
        </div>
    )
}

export default ImageModal
