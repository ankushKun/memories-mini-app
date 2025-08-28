import React, { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon, FileText, MapPin } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { useIsMobile } from '../hooks/use-mobile'

interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    onUpload?: (data: UploadData) => void
}

export interface UploadData {
    file: File
    title: string
    description: string
    location: string
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [location, setLocation] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isMobile = useIsMobile()

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault()
    }

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault()
        const file = event.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!selectedFile || !title.trim()) return

        setIsUploading(true)

        try {
            const uploadData: UploadData = {
                file: selectedFile,
                title: title.trim(),
                description: description.trim(),
                location: location.trim()
            }

            onUpload?.(uploadData)
            handleClose()
        } catch (error) {
            console.error('Upload failed:', error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleClose = () => {
        setSelectedFile(null)
        setPreviewUrl(null)
        setTitle('')
        setDescription('')
        setLocation('')
        setIsUploading(false)
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        onClose()
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose()
        }
    }

    if (!isOpen) return null

    return (
        <div
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center ${isMobile ? 'p-4' : 'p-8'}`}
            onClick={handleBackdropClick}
        >
            <Card className={`bg-slate-900/95 border-white/10 w-full overflow-hidden shadow-2xl ${isMobile ? 'max-h-[90vh] rounded-xl' : 'max-w-2xl max-h-[85vh] rounded-xl'}`}>
                <CardHeader className="border-b border-white/10 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className={`text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>
                            Upload Your Memory
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full w-8 h-8 p-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className={`overflow-y-auto ${isMobile ? 'p-4 space-y-4' : 'p-6 space-y-6'}`}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Upload Area */}
                        <div className="space-y-2">
                            <Label htmlFor="file-upload" className="text-white font-medium">
                                Image
                            </Label>
                            <div
                                className={`border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors cursor-pointer ${selectedFile ? 'bg-white/5' : 'bg-white/5'}`}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                    <div className="space-y-4">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-h-48 mx-auto rounded-lg object-cover"
                                        />
                                        <p className="text-white/70 text-sm">
                                            Click to change image
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-white/70" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium mb-1">
                                                Drop your image here, or click to browse
                                            </p>
                                            <p className="text-white/60 text-sm">
                                                Supports JPG, PNG, GIF up to 10MB
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="file-upload"
                                />
                            </div>
                        </div>

                        {/* Title Input */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-white font-medium flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Title *
                            </Label>
                            <Input
                                id="title"
                                type="text"
                                placeholder="Give your memory a title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                                required
                            />
                        </div>

                        {/* Description Input */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-white font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Tell the story behind this memory..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 min-h-[100px] resize-none"
                                rows={4}
                            />
                        </div>

                        {/* Location Input */}
                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-white font-medium flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Location
                            </Label>
                            <Input
                                id="location"
                                type="text"
                                placeholder="Where was this memory captured?"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                                disabled={isUploading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-0"
                                disabled={!selectedFile || !title.trim() || isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Memory
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default UploadModal
