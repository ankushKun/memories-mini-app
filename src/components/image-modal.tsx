import React from 'react'
import { X, Calendar, MapPin, Camera, Heart } from 'lucide-react'
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

    return (
        <div
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center ${isMobile ? 'p-2' : 'p-4'}`}
            onClick={handleBackdropClick}
        >
            <Card className={`bg-slate-900/95 border-white/20 w-full overflow-hidden ${isMobile ? 'h-full max-h-none' : 'max-w-4xl max-h-[90vh]'}`}>
                <div className="relative h-full">
                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} z-10 bg-black/50 hover:bg-black/70 text-white border-white/20`}
                    >
                        <X className="w-4 h-4" />
                    </Button>

                    <div className={`${isMobile ? 'flex flex-col h-full' : 'grid md:grid-cols-2 gap-0'}`}>
                        {/* Image section */}
                        <div className={`relative bg-black/50 ${isMobile ? 'flex-1 min-h-0' : 'aspect-square'}`}>
                            <img
                                src={item.imageUrl}
                                alt={item.title || 'Image'}
                                className="w-full h-full object-cover"
                                draggable={false}
                            />
                        </div>

                        {/* Details section */}
                        <CardContent className={`space-y-6 overflow-y-auto ${isMobile ? 'p-4 max-h-[40vh]' : 'p-6 max-h-[90vh]'}`}>
                            <div>
                                <h2 className={`font-bold text-white mb-2 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                                    {item.title || 'Untitled Memory'}
                                </h2>
                                <p className={`text-white/80 leading-relaxed ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                    {details.description}
                                </p>
                            </div>

                            {/* Metadata */}
                            <div className={isMobile ? 'space-y-2' : 'space-y-4'}>
                                <div className="flex items-center gap-3 text-white/70">
                                    <Calendar className="w-4 h-4" />
                                    <span className={isMobile ? 'text-xs' : 'text-sm'}>
                                        {details.date.toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 text-white/70">
                                    <MapPin className="w-4 h-4" />
                                    <span className={isMobile ? 'text-xs' : 'text-sm'}>{details.location}</span>
                                </div>

                                <div className="flex items-center gap-3 text-white/70">
                                    <Camera className="w-4 h-4" />
                                    <span className={isMobile ? 'text-xs' : 'text-sm'}>{details.camera}</span>
                                </div>

                                <div className="flex items-center gap-3 text-white/70">
                                    <Heart className="w-4 h-4" />
                                    <span className={isMobile ? 'text-xs' : 'text-sm'}>{details.likes} likes</span>
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <h3 className={`text-white font-medium ${isMobile ? 'mb-2 text-sm' : 'mb-3'}`}>Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {details.tags.map((tag, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className={`bg-white/10 text-white/90 hover:bg-white/20 ${isMobile ? 'text-xs px-2 py-1' : ''}`}
                                        >
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className={`flex gap-3 ${isMobile ? 'pt-2' : 'pt-4'}`}>
                                <Button
                                    variant="outline"
                                    size={isMobile ? "sm" : "default"}
                                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                    <Heart className="w-4 h-4 mr-2" />
                                    Like
                                </Button>
                                <Button
                                    variant="outline"
                                    size={isMobile ? "sm" : "default"}
                                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                    Share
                                </Button>
                            </div>
                        </CardContent>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default ImageModal
