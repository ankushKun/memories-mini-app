import React, { useState, useEffect, useRef } from 'react'
import { X, Share2 } from 'lucide-react'
import { Button } from './ui/button'
import { useIsMobile } from '../hooks/use-mobile'
import type { CanvasItem } from './infinite-canvas'
import StampPreview from './stamp-preview'
import CopySharePopup from './copy-share-popup'
import { domToBlob } from 'modern-screenshot'

interface ImageModalProps {
    item: CanvasItem | null
    isOpen: boolean
    onClose: () => void
}

const ImageModal: React.FC<ImageModalProps> = ({ item, isOpen, onClose }) => {
    const isMobile = useIsMobile()
    const [isAnimating, setIsAnimating] = useState(false)
    const [shouldRender, setShouldRender] = useState(false)
    const [isSharePopupOpen, setIsSharePopupOpen] = useState(false)
    const [isCapturing, setIsCapturing] = useState(false)
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
    const hiddenHorizontalRef = useRef<HTMLDivElement>(null)

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

    // Handle ESC key press to close modal
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        if (isOpen) {
            window.addEventListener('keydown', handleEscKey)
        }

        return () => {
            window.removeEventListener('keydown', handleEscKey)
        }
    }, [isOpen, onClose])

    const captureStampAsImage = async (): Promise<Blob | null> => {
        // Always capture the horizontal version
        if (!hiddenHorizontalRef.current) return null

        try {
            setIsCapturing(true)

            // Temporarily make the horizontal version visible
            const element = hiddenHorizontalRef.current
            const originalVisibility = element.style.visibility
            const originalOpacity = element.style.opacity

            element.style.visibility = 'visible'
            element.style.opacity = '1'
            element.style.position = 'absolute'
            element.style.left = '0'
            element.style.top = '0'
            element.style.zIndex = '9999'

            // Wait for images to fully render
            await new Promise(resolve => setTimeout(resolve, 200))

            // Capture the horizontal stamp preview element as a blob
            const blob = await domToBlob(element, {
                scale: 2, // Higher quality (2x resolution)
                quality: 1, // Maximum quality
                type: 'image/png'
            })

            // Hide it again
            element.style.visibility = originalVisibility
            element.style.opacity = originalOpacity
            element.style.zIndex = ''

            return blob
        } catch (error) {
            console.error('Error capturing stamp:', error)
            // Make sure to hide it even if there's an error
            if (hiddenHorizontalRef.current) {
                const element = hiddenHorizontalRef.current
                element.style.visibility = 'hidden'
                element.style.opacity = '0'
                element.style.zIndex = ''
            }
            return null
        } finally {
            setIsCapturing(false)
        }
    }

    const handleShare = async () => {
        const blob = await captureStampAsImage()
        if (blob) {
            setCapturedBlob(blob)
        }
        setIsSharePopupOpen(true)
    }

    const handleSharePopupClose = () => {
        setIsSharePopupOpen(false)
    }

    const getShareUrl = () => {
        if (!item) return ''
        return `${window.location.origin}/#/view/${item.id.split("-tile")[0]}`
    }

    const getTweetText = () => {
        if (!item) return ''
        return `Check out this memory "${item.title || 'Memory'}" preserved forever on Arweave! 🌟\n\nView it at: ${getShareUrl()}\n\n#PermanentOnArweave`
    }

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
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-300 ease-out ${isAnimating
                ? 'bg-black/90 backdrop-blur-md'
                : 'bg-black/0 backdrop-blur-none'
                }`}
            onClick={handleBackdropClick}
        >
            {/* Stamp Preview - centered with animation */}
            <div
                className={`relative flex items-center h-full justify-center transition-all duration-300 ease-out ${isMobile ? 'w-80' : 'w-[600px]'
                    } ${isAnimating
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-90 translate-y-4'
                    }`}
            >
                {/* Close button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className={`absolute top-5 -right-10 z-10 bg-black/60 hover:bg-black/80 text-white border-white/20 rounded-full w-12 h-12 p-0 transition-all duration-300 ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                        }`}
                >
                    <X className="w-6 h-6" />
                </Button>
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
            </div>

            {/* Hidden horizontal version for capturing - always horizontal */}
            <div
                ref={hiddenHorizontalRef}
                className="absolute left-0 top-0 opacity-0 pointer-events-none"
                style={{ visibility: 'hidden' }}
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
                    layout="horizontal"
                />
            </div>

            {/* Share button */}
            <Button
                onClick={handleShare}
                disabled={isCapturing}
                size='lg'
                className={`absolute h-12 bottom-6 left-6 bg-[#000DFF] hover:bg-[#000DFF]/90 text-white border border-[#2C2C2C] px-6 py-3 text-base font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-300 shadow-lg ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                    }`}
            >
                <Share2 className="w-4 h-4" />
                {isCapturing ? 'Capturing...' : 'Share'}
            </Button>

            {/* Copy & Share Popup */}
            <CopySharePopup
                isOpen={isSharePopupOpen}
                onClose={handleSharePopupClose}
                polaroidBlob={capturedBlob}
                tweetText={getTweetText()}
                shareUrl={getShareUrl()}
                onTwitterOpen={handleSharePopupClose}
            />
        </div>
    )
}

export default ImageModal
