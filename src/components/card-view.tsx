import React, { useState, useEffect } from 'react'
import type { CanvasItem } from './infinite-canvas'
import StampPreview from './stamp-preview'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from './ui/carousel'

interface CardViewProps {
    items: CanvasItem[]
    onImageClick: (item: CanvasItem) => void
}

const CardView: React.FC<CardViewProps> = ({ items, onImageClick }) => {
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        if (!api) return

        setCurrent(api.selectedScrollSnap())

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!api) return

            if (event.key === 'ArrowLeft') {
                event.preventDefault()
                api.scrollPrev()
            } else if (event.key === 'ArrowRight') {
                event.preventDefault()
                api.scrollNext()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [api])

    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-white/60">No memories to display</p>
            </div>
        )
    }

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        const d = typeof date === 'string' ? new Date(date) : date
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    return (
        <div className="w-screen mx-auto h-full flex items-center justify-center px-4 md:px-20 py-16 md:py-24 overflow-visible">
            <Carousel
                opts={{
                    align: "center",
                    loop: true,
                }}
                setApi={setApi}
                className="overflow-visible py-8"
            >
                <CarouselContent className="overflow-visible py-12 w-screen md:!w-[125vw]">
                    {items.map((item, index) => {
                        const isCenterItem = index === current
                        return (
                            <CarouselItem
                                key={item.id}
                                className="basis-full md:basis-1/5 mx-auto flex items-center justify-center px-2 md:px-4"
                            >
                                <div
                                    className={`cursor-pointer transition-all mx-auto relative duration-500 flex items-center justify-center ease-out ${isCenterItem
                                        ? 'md:scale-100 !z-50 opacity-100'
                                        : 'md:!scale-80 md:opacity-60 z-10'
                                        } hover:opacity-100`}
                                    onClick={() => onImageClick(item)}
                                >
                                    <StampPreview
                                        headline={item.title || 'Your Memory'}
                                        location={item.metadata?.location || 'EARTH'}
                                        handle="@memories"
                                        date={formatDate(item.metadata?.date)}
                                        imageSrc={item.imageUrl}
                                        layout="vertical"
                                        className="w-full max-w-[90vw] md:max-w-full h-auto drop-shadow-2xl"
                                    />
                                </div>

                            </CarouselItem>
                        )
                    })}
                </CarouselContent>

                {/* Navigation Buttons */}
                <CarouselPrevious
                    className="left-[20%] md:left-[35%] bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm disabled:opacity-30"
                />
                <CarouselNext
                    className="right-[20%] md:right-[35%] bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm disabled:opacity-30"
                />


            </Carousel>
        </div>
    )
}

export default CardView

