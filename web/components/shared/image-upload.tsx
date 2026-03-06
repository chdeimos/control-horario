'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    bucket?: string
    path?: string
    label?: string
}

export function ImageUpload({ value, onChange, bucket = 'branding', path = 'logos', label }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const supabase = createClient()

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        try {
            const file = e.target.files?.[0]
            if (!file) return

            setUploading(true)

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Por favor, selecciona una imagen válida')
                return
            }

            // Create a unique file name
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
            const filePath = `${path}/${fileName}`

            const { error: uploadError, data } = await supabase.storage
                .from(bucket)
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)

            onChange(publicUrl)
            toast.success('Imagen subida correctamente')
        } catch (error: any) {
            toast.error(`Error al subir imagen: ${error.message}`)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-2">
            {label && <span className="text-sm font-medium">{label}</span>}
            <div className="flex flex-col gap-4">
                {value ? (
                    <div className="relative w-full aspect-video md:aspect-auto md:h-24 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden group">
                        <img
                            src={value}
                            alt="Preview"
                            className="h-full w-full object-contain p-2"
                        />
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            disabled={uploading}
                            className="cursor-pointer"
                        />
                        {uploading && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-md">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
