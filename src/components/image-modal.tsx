import React, { useState } from 'react'
import { X, Calendar, MapPin, Camera, Heart, Share2, ExternalLink, Eye, Check } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { useIsMobile } from '../hooks/use-mobile'
import type { CanvasItem } from './infinite-canvas'

interface ImageModalProps {
    item: CanvasItem | null
    isOpen: boolean
    onClose: () => void
}

const ImageModal: React.FC<ImageModalProps> = ({ item, isOpen, onClose }) => {
    const isMobile = useIsMobile()
    const navigate = useNavigate()
    const [shareButtonText, setShareButtonText] = useState('Share')
    const [isShareCopied, setIsShareCopied] = useState(false)

    if (!isOpen || !item) return null

    // Use metadata from the item, with fallbacks
    const details = {
        date: item.metadata?.date || new Date(),
        location: item.metadata?.location || 'Unknown Location',
        camera: item.metadata?.camera || 'Unknown Camera',
        tags: item.metadata?.tags || ['memory'],
        likes: Math.floor(Math.random() * 1000) + 10, // Still random for likes
        description: item.metadata?.description || 'A beautiful memory captured in time.'
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    // Extract the original transaction ID by removing tile suffix if present
    const getOriginalTransactionId = (id: string): string => {
        // Remove tile suffix pattern: -tile-{col}-{row}
        return id.replace(/-tile-\d+-\d+$/, '').slice(0, 43)
    }

    const originalTransactionId = getOriginalTransactionId(item.id)

    const handleShare = async () => {
        try {
            const viewUrl = `${window.location.origin}${window.location.pathname}#/view/${originalTransactionId}`
            await navigator.clipboard.writeText(viewUrl)
            setIsShareCopied(true)
            setShareButtonText('Copied!')
            setTimeout(() => {
                setIsShareCopied(false)
                setShareButtonText('Share')
            }, 2000)
        } catch (err) {
            console.error('Failed to copy to clipboard:', err)
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement('textarea')
            textArea.value = `${window.location.origin}${window.location.pathname}#/view/${originalTransactionId}`
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setIsShareCopied(true)
            setShareButtonText('Copied!')
            setTimeout(() => {
                setIsShareCopied(false)
                setShareButtonText('Share')
            }, 2000)
        }
    }

    const handleViewRaw = () => {
        window.open(`https://arweave.net/${originalTransactionId}`, '_blank')
    }

    const handleViewImage = () => {
        onClose()
        navigate(`/view/${originalTransactionId}`)
    }

    return (
        <div
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center ${isMobile ? 'p-0' : 'p-8'}`}
            onClick={handleBackdropClick}
        >
            <Card className={`bg-slate-900/95 border-white/10 w-full overflow-hidden shadow-2xl ${isMobile ? 'h-full max-h-none rounded-none' : 'max-w-5xl max-h-[85vh] rounded-xl'}`}>
                <div className="relative h-full md:pl-6">
                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className={`absolute ${isMobile ? 'top-3 right-3' : 'top-6 right-6'} z-10 bg-black/60 hover:bg-black/80 text-white border-white/20 rounded-full w-10 h-10 p-0`}
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    <div className={`${isMobile ? 'flex flex-col h-full' : 'grid grid-cols-3 gap-0 h-full'}`}>
                        {/* Image section */}
                        <div className={`relative bg-black/30 ${isMobile ? 'flex-1 min-h-0' : 'col-span-2'}`}>
                            <img
                                src={item.imageUrl}
                                alt={item.title || 'Image'}
                                className="w-full h-full object-cover rounded-md"
                                draggable={false}
                            />
                        </div>

                        {/* Details section */}
                        <div className={`bg-slate-900/98 ${isMobile ? 'flex-shrink-0' : 'col-span-1'}`}>
                            <CardContent className={`h-full overflow-y-auto ${isMobile ? 'p-6 space-y-4' : 'p-8 space-y-6'}`}>
                                {/* Header */}
                                <div className="border-b border-white/10 pb-4">
                                    <h2 className={`font-bold text-white mb-3 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                                        {item.title || 'Untitled Memory'}
                                    </h2>
                                    <p className={`text-white/70 leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>
                                        {details.description}
                                    </p>
                                </div>

                                {/* Metadata */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-white/80">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <span className={isMobile ? 'text-sm' : 'text-base'}>
                                            {details.date.toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-white/80">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <span className={isMobile ? 'text-sm' : 'text-base'}>{details.location}</span>
                                    </div>

                                    {/* <div className="flex items-center gap-3 text-white/80">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                            <Camera className="w-4 h-4" />
                                        </div>
                                        <span className={isMobile ? 'text-sm' : 'text-base'}>{details.camera}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-white/80">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                            <Heart className="w-4 h-4" />
                                        </div>
                                        <span className={isMobile ? 'text-sm' : 'text-base'}>{details.likes} likes</span>
                                    </div> */}
                                </div>

                                {/* Tags */}
                                {/* <div className="border-t border-white/10 pt-4">
                                    <h3 className={`text-white font-semibold mb-3 ${isMobile ? 'text-base' : 'text-lg'}`}>Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {details.tags.map((tag, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className={`bg-white/15 text-white/90 hover:bg-white/25 border-white/20 ${isMobile ? 'text-sm px-3 py-1' : 'text-sm px-3 py-1.5'}`}
                                            >
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div> */}

                                {/* Actions */}
                                <div className="border-t border-white/10 pt-6 mt-auto">
                                    <div className="space-y-3">
                                        {/* Share Button */}
                                        <Button
                                            onClick={handleShare}
                                            variant="outline"
                                            size={isMobile ? "default" : "lg"}
                                            className={`w-full border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-colors ${isShareCopied ? 'bg-green-600/20 border-green-500/30' : 'bg-white/10'
                                                }`}
                                        >
                                            {isShareCopied ? (
                                                <Check className="w-4 h-4 mr-2" />
                                            ) : (
                                                <Share2 className="w-4 h-4 mr-2" />
                                            )}
                                            {shareButtonText}
                                        </Button>

                                        {/* View Buttons */}
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleViewImage}
                                                variant="outline"
                                                size={isMobile ? "sm" : "default"}
                                                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Image
                                            </Button>
                                            <Button
                                                onClick={handleViewRaw}
                                                variant="outline"
                                                size={isMobile ? "sm" : "default"}
                                                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                View Raw
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default ImageModal
