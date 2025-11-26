import permanentImage from "@/assets/permanent-light.png"
import postcardV from "@/assets/postcard-v.svg"
import postcardH from "@/assets/postcard-h.svg"
import postcardSquareBg from "@/assets/postcard-square.svg"
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { ImageUp, Upload, Loader2 } from "lucide-react";
import { Input } from "./ui/input";

interface StampPreviewProps {
    headline: string;
    location: string;
    handle: string;
    date: string;
    imageSrc: string;
    size?: 'sm' | 'md' | 'lg';
    layout: 'horizontal' | 'vertical';
    noText?: boolean;
    onLoad?: () => void;
    onError?: () => void;
    className?: string;
    onReselect?: () => void;
    isProcessing?: boolean;

    onHeadlineChange?: (value: string) => void;
    onLocationChange?: (value: string) => void;
    onHandleChange?: (value: string) => void;
}

export default function StampPreview({
    headline,
    location,
    handle,
    date,
    imageSrc,
    layout,
    noText = false,
    size,
    onLoad,
    onError,
    className,
    onReselect,
    isProcessing = false,
    onHeadlineChange,
    onLocationChange,
    onHandleChange,
}: StampPreviewProps) {
    if (!handle) {
        handle = 'Your Handle'
    }
    if (!handle.startsWith('@')) {
        handle = `${handle}`.replace('@', '')
    }
    if (!headline) {
        headline = 'Your Memory'
    }
    if (!location) {
        location = 'Memory Location'
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
                noText ? 'aspect-[1/1]' : layout === 'horizontal' ? 'aspect-[1.66/1]' : 'aspect-[1/1.66]',
                !className?.includes('w-') && (noText ? 'w-[min(90vw,theme(maxWidth.2xl))]' : layout === 'horizontal' ? 'w-[min(90vw,theme(maxWidth.5xl))]' : 'w-[min(90vw,theme(maxWidth.lg))]'),
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
                    "flex flex-col justify-between grow",
                    layout === 'horizontal' ? 'flex-1 p-8 px-10 max-w-1/2' : 'flex-1 w-full p-10 px-12 grow'
                )}>
                    <div className={cn("space-y-4", layout === 'horizontal' && 'space-y-2')}>
                        {/* Main headline */}
                        <div className="items-center justify-center">
                            <h1
                                // contentEditable
                                id="headline-text"
                                // suppressContentEditableWarning
                                onBlur={(e) => onHeadlineChange?.(e.currentTarget.textContent || '')}
                                className={cn(
                                    "font-light w-full leading-tight cursor-text font-instrument text-left rounded focus:outline-2 outline-blue-400/50",
                                    size === 'sm' ? 'text-2xl md:text-4xl min-h-[2rem] md:min-h-[2.5rem]' : size === 'lg' ? 'text-5xl md:text-8xl min-h-[3.5rem] md:min-h-[5rem]' : (layout === 'horizontal' ? 'text-4xl md:text-7xl min-h-[2.5rem] md:min-h-[4.5rem]' : 'text-3xl md:text-6xl min-h-[2rem] md:min-h-[3.75rem]')
                                )}
                            >
                                {headline}
                            </h1>
                            {/* <Input className={cn(
                                "font-light leading-tight font-instrument text-left",
                                size === 'sm' ? 'text-2xl md:text-4xl' : size === 'lg' ? 'text-5xl md:text-8xl' : (layout === 'horizontal' ? 'text-4xl md:text-7xl' : 'text-3xl md:text-6xl')
                            )} value={headline} onChange={(e) => setHeadline(e.target.value)} /> */}
                        </div>

                        {/* Header with location and handle */}
                        <div className={cn(
                            "flex items-center justify-start gap-4"
                        )}>
                            <div className="flex items-start gap-1 text-xs max-w-1/2 w-full">
                                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" onClick={() => document.getElementById("location-text")?.focus()}>
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span
                                    // contentEditable
                                    id="location-text"
                                    // suppressContentEditableWarning
                                    onBlur={(e) => onLocationChange?.(e.currentTarget.textContent || '')}
                                    className="uppercase focus:outline-2 outline-blue-400/50 rounded-xs cursor-text tracking-wide font-light inline-block min-w-[8ch]"
                                >{location}</span>
                            </div>
                            <div className="relative max-w-1/2 w-full flex items-start">
                                <span onClick={() => document.getElementById("handle-text")?.focus()} className="font-light  text-xs">{handle.startsWith("@") ? "" : "@"}</span>
                                <span
                                    // contentEditable
                                    id="handle-text"
                                    // suppressContentEditableWarning
                                    onBlur={(e) => onHandleChange?.(e.currentTarget.textContent || '')}
                                    className="font-light rounded-xs text-xs cursor-text focus:outline-2 outline-blue-400/50 inline-block min-w-[6ch]"
                                >{handle}</span>
                            </div>
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
                            <div
                                className="text-[8px] underline underline-offset-2 tracking-wide uppercase block"
                            >
                                onememory.xyz
                            </div>
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
                    "relative overflow-hidden !w-full h-full group",
                    noText
                        ? 'w-full h-full'
                        : cn("aspect-square", layout === 'horizontal' ? 'max-w-[50%]' : 'max-h-[50%]')
                )}>
                    {isProcessing ? (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className={cn("animate-spin text-gray-600", layout === 'horizontal' ? 'w-16 h-16' : 'w-20 h-20')} />
                                <p className="text-gray-600 font-medium text-lg">Processing image...</p>
                            </div>
                        </div>
                    ) : imageSrc ? (
                        <>
                            <img
                                src={imageSrc}
                                alt={headline}
                                className="absolute inset-0 bg-white w-full h-full object-cover object-center"
                                onLoad={onLoad}
                                onError={onError}
                                loading="lazy"
                                draggable={false}
                            />
                            {onReselect && (
                                <>
                                    <div
                                        className={cn(
                                            "absolute bg-black/30 border border-white backdrop-blur-sm rounded-full p-3 cursor-pointer z-50 hover:bg-black/80 transition-colors",
                                            noText ? "top-10 left-8" : "top-7 left-14"
                                        )}
                                        onClick={onReselect}
                                    >
                                        <ImageUp className="w-6 h-6 text-white" />
                                    </div>
                                    <div
                                        className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer z-40"
                                        onClick={onReselect}
                                    >
                                        <Upload className="w-12 h-12 text-white" />
                                        <p className="text-white text-lg font-medium">Select different image</p>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center group">
                            <div className="text-gray-400">
                                <svg className={cn("fill-current", layout === 'horizontal' ? 'w-24 h-24' : 'w-32 h-32')} viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                            </div>
                            {onReselect && (
                                <div
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer z-50"
                                    onClick={onReselect}
                                >
                                    <Upload className="w-12 h-12 text-white" />
                                    <p className="text-white text-lg font-medium">Select an image</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Date stamp - Position varies by layout */}
                    {!noText && <div
                        className={cn(
                            "absolute text-white font-semibold tracking-wider z-10",
                            layout === 'horizontal'
                                ? 'right-8 bottom-8 text-base'
                                : 'right-12 bottom-12 text-lg'
                        )}
                        style={{
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed',
                            letterSpacing: '0.2em',
                            mixBlendMode: 'difference'
                        }}
                    >
                        {date}
                    </div>}
                </div>
            </div>
        </div>
    );
}