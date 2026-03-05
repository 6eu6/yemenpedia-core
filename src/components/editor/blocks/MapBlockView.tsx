/**
 * Map Block View Component
 * 
 * Interactive map block with:
 * - OpenStreetMap/Leaflet
 * - Coordinate picker
 * - Label editing
 * - Search location
 */

'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { Map as MapIcon, MapPin, Trash2, Edit2, X, Check, Search, Crosshair, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { MapBlockProps } from '../types'

// Leaflet types - will be loaded dynamically
type LeafletModule = typeof import('leaflet').default

// Yemen bounds
const YEMEN_BOUNDS = {
  north: 19.0,
  south: 11.5,
  east: 54.5,
  west: 42.5,
}

// Yemen center
const YEMEN_CENTER = {
  lat: 15.5527,
  lng: 48.5164,
  zoom: 6,
}

export function MapBlockView({ 
  node, 
  selected, 
  editor, 
  updateAttributes, 
  deleteNode 
}: MapBlockProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [editLat, setEditLat] = useState(node.attrs.lat)
  const [editLng, setEditLng] = useState(node.attrs.lng)
  const [editZoom, setEditZoom] = useState(node.attrs.zoom)
  const [editLabel, setEditLabel] = useState(node.attrs.label || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{
    lat: number
    lng: number
    name: string
  }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [leafletLoading, setLeafletLoading] = useState(false)
  
  const { lat, lng, zoom, label, height } = node.attrs
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const leafletRef = useRef<LeafletModule | null>(null)
  
  useEffect(() => {
    setEditLat(lat)
    setEditLng(lng)
    setEditZoom(zoom)
    setEditLabel(label)
  }, [lat, lng, zoom, label])
  
  // Load Leaflet dynamically when dialog opens
  useEffect(() => {
    if (!showDialog || leafletLoaded || leafletLoading) return
    
    setLeafletLoading(true)
    
    // Dynamic import of Leaflet and CSS
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ])
      .then(([leafletModule]) => {
        leafletRef.current = leafletModule.default
        setLeafletLoaded(true)
      })
      .catch((error) => {
        console.error('Failed to load Leaflet:', error)
      })
      .finally(() => {
        setLeafletLoading(false)
      })
  }, [showDialog, leafletLoaded, leafletLoading])
  
  // Initialize map when dialog opens and Leaflet is loaded
  useEffect(() => {
    const L = leafletRef.current
    
    if (showDialog && mapRef.current && L && !mapInstanceRef.current) {
      // Fix default marker icon issue in Leaflet with bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
      
      mapInstanceRef.current = L.map(mapRef.current).setView([editLat, editLng], editZoom)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current)
      
      markerRef.current = L.marker([editLat, editLng]).addTo(mapInstanceRef.current)
      
      // Click to set marker
      mapInstanceRef.current.on('click', (e: any) => {
        const { lat: newLat, lng: newLng } = e.latlng
        setEditLat(parseFloat(newLat.toFixed(6)))
        setEditLng(parseFloat(newLng.toFixed(6)))
        markerRef.current.setLatLng([newLat, newLng])
      })
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [showDialog, leafletLoaded, editLat, editLng, editZoom])
  
  // Reset Leaflet state when dialog closes
  useEffect(() => {
    if (!showDialog) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [showDialog])
  
  // Search location
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        format: 'json',
        limit: '5',
        'accept-language': 'ar,en',
        bounded: '1',
        viewbox: `${YEMEN_BOUNDS.west},${YEMEN_BOUNDS.north},${YEMEN_BOUNDS.east},${YEMEN_BOUNDS.south}`,
      })
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            'User-Agent': 'Yemenpedia/1.0',
          },
        }
      )
      
      const data = await response.json()
      
      setSearchResults(data.map((result: any) => ({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        name: result.display_name,
      })))
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery])
  
  // Select search result
  const handleSelectResult = useCallback((result: { lat: number; lng: number; name: string }) => {
    setEditLat(result.lat)
    setEditLng(result.lng)
    setEditZoom(14)
    
    // Safely split name
    const nameParts = result.name?.split(',') || []
    setEditLabel(nameParts[0] || result.name || '')
    
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([result.lat, result.lng], 14)
      markerRef.current.setLatLng([result.lat, result.lng])
    }
    
    setSearchResults([])
    setSearchQuery('')
  }, [])
  
  const handleSaveEdit = useCallback(() => {
    updateAttributes({
      lat: editLat,
      lng: editLng,
      zoom: editZoom,
      label: editLabel,
    })
    setShowDialog(false)
  }, [editLat, editLng, editZoom, editLabel, updateAttributes])
  
  const handleUseCurrentLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setEditLat(position.coords.latitude)
          setEditLng(position.coords.longitude)
          setEditZoom(15)
          
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([position.coords.latitude, position.coords.longitude], 15)
            markerRef.current.setLatLng([position.coords.latitude, position.coords.longitude])
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
        }
      )
    }
  }, [])
  
  return (
    <NodeViewWrapper className={`map-block-wrapper relative ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      {/* Map display */}
      <div className="map-block">
        {/* Toolbar */}
        {selected && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-1 flex gap-1 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDialog(true)}
              title="تعديل"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteNode}
              className="text-destructive hover:text-destructive"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {/* Static map iframe for display */}
        <div className="relative">
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`}
            width="100%"
            height={height || 400}
            style={{ border: 0, borderRadius: '8px' }}
            loading="lazy"
          />
          
          {/* Label overlay */}
          {label && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                <MapPin className="w-4 h-4 text-primary" />
                {label}
              </div>
            </div>
          )}
          
          {/* Coordinates overlay */}
          <div className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-800/90 px-2 py-1 rounded text-xs text-zinc-600 dark:text-zinc-400">
            {lat.toFixed(4)}°, {lng.toFixed(4)}°
          </div>
        </div>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapIcon className="w-5 h-5" />
              تحديد الموقع على الخريطة
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-4">
            {/* Map picker */}
            <div className="lg:col-span-2">
              <div 
                ref={mapRef}
                className="h-[400px] rounded-lg overflow-hidden border bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"
              >
                {leafletLoading && (
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span>جاري تحميل الخريطة...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-2 text-center">
                اضغط على الخريطة لتحديد الموقع
              </p>
            </div>
            
            {/* Controls */}
            <div className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>البحث عن موقع</Label>
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن مدينة أو موقع..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        className="w-full text-right p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-b last:border-b-0 text-sm"
                        onClick={() => handleSelectResult(result)}
                      >
                        {result.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="lat">خط العرض</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="0.000001"
                    value={editLat}
                    onChange={(e) => setEditLat(parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lng">خط الطول</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="0.000001"
                    value={editLng}
                    onChange={(e) => setEditLng(parseFloat(e.target.value))}
                  />
                </div>
              </div>
              
              {/* Zoom */}
              <div className="space-y-1">
                <Label htmlFor="zoom">مستوى التكبير ({editZoom})</Label>
                <input
                  id="zoom"
                  type="range"
                  min="1"
                  max="18"
                  value={editZoom}
                  onChange={(e) => setEditZoom(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              {/* Label */}
              <div className="space-y-1">
                <Label htmlFor="label">اسم الموقع</Label>
                <Input
                  id="label"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="مثال: مدينة تعز"
                />
              </div>
              
              {/* Use current location */}
              <Button
                variant="outline"
                onClick={handleUseCurrentLocation}
                className="w-full"
              >
                <Crosshair className="w-4 h-4 ml-2" />
                استخدام موقعي الحالي
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
            <Button onClick={handleSaveEdit}>
              <Check className="w-4 h-4 ml-2" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  )
}

export default MapBlockView
