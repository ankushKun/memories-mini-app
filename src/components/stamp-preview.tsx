import permanentImage from "@/assets/permanent-light.png"
import postcardV from "@/assets/postcard-v.svg"
import postcardH from "@/assets/postcard-h.svg"
import postcardSquareBg from "@/assets/postcard-square.svg"
import { cn } from "@/lib/utils";

interface StampPreviewProps {
    headline: string;
    location: string;
    handle: string;
    date: string;
    imageSrc: string;
    layout: 'horizontal' | 'vertical';
    noText?: boolean;
    onLoad?: () => void;
    onError?: () => void;
    className?: string;
}

export default function StampPreview({
    headline,
    location,
    handle,
    date,
    imageSrc,
    layout,
    noText = false,
    onLoad,
    onError,
    className,
}: StampPreviewProps) {
    if (!handle) {
        handle = 'YOU'
    }
    if (!handle.startsWith('@')) {
        handle = `@${handle}`
    }
    if (!headline) {
        headline = 'Your first memory'
    }
    if (!location) {
        location = 'ANYWHERE, EARTH'
    }
    if (!date) {
        date = new Date().toLocaleDateString()
    }
    if (!imageSrc) {
        imageSrc = ''
    }
    if (!layout) {
        layout = 'vertical'
    }

    // Select the appropriate background based on layout and noText
    const postcardBg = noText
        ? postcardSquareBg
        : layout === 'horizontal'
            ? postcardH
            : postcardV;

    return (
        <div
            className={cn(`relative text-black overflow-clip`,
                noText ? 'aspect-[1/1]' : layout === 'horizontal' ? 'aspect-[1.66/1] min-w-4xl' : 'aspect-[1/1.66] max-w-lg',
                className
            )}
            style={{
                backgroundImage: `url(${postcardBg})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                maskImage: `url(${postcardBg})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: `url(${postcardBg})`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
            }}
        >
            {/* Main content - Two sections stacked vertically or horizontally */}
            <div className={cn("relative z-10 flex h-full w-full", layout === 'horizontal' ? 'flex-row' : 'flex-col')}>
                {/* Text section - Left side (horizontal) or Top (vertical) */}
                {!noText && <div className={cn(
                    "flex flex-col justify-between",
                    layout === 'horizontal' ? 'flex-1 p-8 px-10' : 'flex-1 w-full p-10 px-12 grow'
                )}>
                    <div className={cn("space-y-4", layout === 'horizontal' && 'space-y-2')}>
                        {/* Main headline */}
                        <div className="items-center justify-center">
                            <h1 className={cn(
                                "font-light leading-tight font-instrument text-left text-7xl"
                            )}>
                                {headline}
                            </h1>
                        </div>

                        {/* Header with location and handle */}
                        <div className={cn(
                            "flex items-start gap-4"
                        )}>
                            <div className="flex items-center gap-1 text-xs">
                                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span className="uppercase tracking-wide font-light">{location}</span>
                            </div>
                            <span className="font-light text-xs">{handle}</span>
                        </div>
                    </div>


                    {/* Footer with branding */}
                    <div className={cn(
                        "flex items-end gap-4 mt-6 justify-between"
                    )}>
                        <div className="space-y-1">
                            <p className="text-[8px] tracking-wide uppercase leading-tight">
                                Your memories deserve forever
                            </p>
                            <a
                                href="https://memories.ar.io"
                                className="text-[8px] underline underline-offset-2 tracking-wide uppercase block"
                            >
                                memories.ar.io
                            </a>
                        </div>

                        {/* Permanent on Arweave badge */}
                        <img src={permanentImage} alt="Permanent on Arweave" className={cn(
                            "relative",
                            layout === 'horizontal' ? 'h-8' : 'h-10 top-1'
                        )} />
                    </div>
                </div>}

                {/* Image section - Right side (horizontal) or Bottom (vertical) */}
                <div className={cn(
                    "relative overflow-hidden",
                    noText
                        ? 'w-full h-full'
                        : cn("aspect-square", layout === 'horizontal' ? 'max-w-[50%]' : 'max-h-[50%]')
                )}>
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt={headline}
                            className="absolute inset-0 w-full h-full object-cover object-center"
                            onLoad={onLoad}
                            onError={onError}
                            loading="lazy"
                            draggable={false}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                            <div className="text-gray-400">
                                <svg className={cn("fill-current", layout === 'horizontal' ? 'w-24 h-24' : 'w-32 h-32')} viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Date stamp - Position varies by layout */}
                    {!noText && <div
                        className={cn(
                            "absolute text-[#000DFF] invert font-medium tracking-wider z-10",
                            layout === 'horizontal'
                                ? 'right-8 bottom-8 text-base'
                                : 'right-12 bottom-12 text-lg'
                        )}
                        style={{
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed',
                            letterSpacing: '0.2em'
                        }}
                    >
                        {date}
                    </div>}
                </div>
            </div>
        </div>
    );
}