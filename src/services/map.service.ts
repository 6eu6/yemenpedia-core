/**
 * MapService - OpenStreetMap Integration
 * 
 * Provides map functionality for articles:
 * - Coordinate storage and retrieval
 * - Leaflet.js integration helpers
 * - Geocoding (forward/reverse)
 * - Map embed generation
 * 
 * @example
 * const mapService = MapService.getInstance()
 * const coords = await mapService.geocode('تعز، اليمن')
 */

// ============================================
// Types & Interfaces
// ============================================

export interface Coordinates {
  lat: number
  lng: number
  zoom?: number
}

export interface MapMarker {
  lat: number
  lng: number
  label?: string
  description?: string
  articleId?: string
}

export interface GeocodingResult {
  lat: number
  lng: number
  displayName: string
  city?: string
  state?: string
  country?: string
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

// ============================================
// MapService Singleton
// ============================================

export class MapService {
  private static instance: MapService
  
  // Yemen bounding box
  private readonly YEMEN_BOUNDS: MapBounds = {
    north: 19.0,
    south: 11.5,
    east: 54.5,
    west: 42.5,
  }

  // Default Yemen center
  private readonly YEMEN_CENTER: Coordinates = {
    lat: 15.5527,
    lng: 48.5164,
    zoom: 6,
  }

  // Nominatim API (OpenStreetMap geocoding)
  private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org'

  private constructor() {}

  public static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService()
    }
    return MapService.instance
  }

  // ============================================
  // Geocoding Methods
  // ============================================

  /**
   * Forward geocoding - Convert address to coordinates
   */
  public async geocode(query: string, limit: number = 5): Promise<GeocodingResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: limit.toString(),
        'accept-language': 'ar,en',
        bounded: '1',
        viewbox: `${this.YEMEN_BOUNDS.west},${this.YEMEN_BOUNDS.north},${this.YEMEN_BOUNDS.east},${this.YEMEN_BOUNDS.south}`,
      })

      const response = await fetch(`${this.NOMINATIM_API}/search?${params}`, {
        headers: {
          'User-Agent': 'Yemenpedia/1.0 (https://yemenpedia.org)',
        },
      })

      if (!response.ok) {
        throw new Error('Geocoding request failed')
      }

      const data = await response.json()

      return data.map((result: any) => ({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        city: result.address?.city || result.address?.town || result.address?.village,
        state: result.address?.state,
        country: result.address?.country,
      }))
    } catch (error) {
      console.error('Geocoding error:', error)
      return []
    }
  }

  /**
   * Reverse geocoding - Convert coordinates to address
   */
  public async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        'accept-language': 'ar,en',
        zoom: '14',
      })

      const response = await fetch(`${this.NOMINATIM_API}/reverse?${params}`, {
        headers: {
          'User-Agent': 'Yemenpedia/1.0 (https://yemenpedia.org)',
        },
      })

      if (!response.ok) {
        throw new Error('Reverse geocoding request failed')
      }

      const data = await response.json()

      if (data.error) {
        return null
      }

      return {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        displayName: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        state: data.address?.state,
        country: data.address?.country,
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }

  // ============================================
  // Coordinate Utilities
  // ============================================

  /**
   * Validate coordinates are within Yemen
   */
  public isValidYemenCoordinates(lat: number, lng: number): boolean {
    return (
      lat >= this.YEMEN_BOUNDS.south &&
      lat <= this.YEMEN_BOUNDS.north &&
      lng >= this.YEMEN_BOUNDS.west &&
      lng <= this.YEMEN_BOUNDS.east
    )
  }

  /**
   * Get default Yemen center coordinates
   */
  public getYemenCenter(): Coordinates {
    return { ...this.YEMEN_CENTER }
  }

  /**
   * Calculate distance between two points (in km)
   */
  public calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  /**
   * Format coordinates for display
   */
  public formatCoordinates(lat: number, lng: number, format: 'dms' | 'dd' = 'dd'): string {
    if (format === 'dms') {
      return `${this.toDMS(lat, 'lat')} ${this.toDMS(lng, 'lng')}`
    }
    return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`
  }

  private toDMS(decimal: number, type: 'lat' | 'lng'): string {
    const absolute = Math.abs(decimal)
    const degrees = Math.floor(absolute)
    const minutesNotTruncated = (absolute - degrees) * 60
    const minutes = Math.floor(minutesNotTruncated)
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2)

    const direction = type === 'lat' 
      ? (decimal >= 0 ? 'N' : 'S')
      : (decimal >= 0 ? 'E' : 'W')

    return `${degrees}°${minutes}'${seconds}"${direction}`
  }

  // ============================================
  // Map Generation
  // ============================================

  /**
   * Generate OpenStreetMap static image URL
   */
  public getStaticMapUrl(
    coords: Coordinates,
    options: {
      width?: number
      height?: number
      markers?: MapMarker[]
    } = {}
  ): string {
    const { width = 600, height = 400, markers = [] } = options
    const { lat, lng, zoom = 12 } = coords

    // Using staticmap from openstreetmap
    // Note: For production, use a proper static map service
    const markerParams = markers
      .map(m => `markers=${m.lat},${m.lng}`)
      .join('&')

    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&${markerParams}`
  }

  /**
   * Generate Leaflet map configuration
   */
  public getLeafletConfig(coords: Coordinates, markers: MapMarker[] = []): {
    center: [number, number]
    zoom: number
    markers: Array<{ position: [number, number]; popup?: string }>
  } {
    return {
      center: [coords.lat, coords.lng],
      zoom: coords.zoom || 12,
      markers: markers.map(m => ({
        position: [m.lat, m.lng],
        popup: m.label
          ? `<strong>${m.label}</strong>${m.description ? `<br>${m.description}` : ''}`
          : undefined,
      })),
    }
  }

  /**
   * Generate embed iframe URL
   */
  public getEmbedUrl(coords: Coordinates, options: { height?: number } = {}): string {
    const { lat, lng, zoom = 12 } = coords
    const { height = 400 } = options

    // Using OpenStreetMap export
    const bbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
  }

  // ============================================
  // Map Data for Articles
  // ============================================

  /**
   * Prepare map data for TipTap block
   */
  public createMapBlock(coords: Coordinates, label?: string): {
    type: string
    attrs: {
      lat: number
      lng: number
      zoom: number
      label?: string
    }
  } {
    return {
      type: 'mapBlock',
      attrs: {
        lat: coords.lat,
        lng: coords.lng,
        zoom: coords.zoom || 12,
        label,
      },
    }
  }

  /**
   * Get tile layer URL for Leaflet
   */
  public getTileLayer(): {
    url: string
    attribution: string
  } {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  }

  // ============================================
  // Yemen Governorates Data
  // ============================================

  /**
   * Get governorate center coordinates
   */
  public getGovernorateCenter(governorateName: string): Coordinates | null {
    const governorates: Record<string, Coordinates> = {
      'صنعاء': { lat: 15.3694, lng: 44.1910, zoom: 11 },
      'عدن': { lat: 12.7855, lng: 45.0187, zoom: 12 },
      'تعز': { lat: 13.5789, lng: 44.0219, zoom: 12 },
      'الحديدة': { lat: 14.7948, lng: 42.9539, zoom: 11 },
      'حضرموت': { lat: 15.9333, lng: 48.7833, zoom: 10 },
      'إب': { lat: 13.9719, lng: 44.1722, zoom: 11 },
      'ذمار': { lat: 14.5428, lng: 44.4031, zoom: 11 },
      'المحويت': { lat: 15.1167, lng: 43.7500, zoom: 11 },
      'حجة': { lat: 15.7000, lng: 43.6000, zoom: 11 },
      'صعدة': { lat: 16.9400, lng: 43.7600, zoom: 11 },
      'الجوف': { lat: 16.4500, lng: 45.3000, zoom: 10 },
      'مأرب': { lat: 15.4700, lng: 45.3300, zoom: 10 },
      'شبوة': { lat: 14.5333, lng: 46.7500, zoom: 10 },
      'أبين': { lat: 13.6000, lng: 45.8333, zoom: 10 },
      'لحج': { lat: 13.0500, lng: 44.5833, zoom: 10 },
      'الضالع': { lat: 13.7000, lng: 44.7333, zoom: 11 },
      'البيضاء': { lat: 14.2833, lng: 45.2833, zoom: 10 },
      'ريمة': { lat: 14.6000, lng: 43.5000, zoom: 10 },
      'المهرة': { lat: 16.6500, lng: 51.8500, zoom: 9 },
      'عمران': { lat: 15.9333, lng: 43.8167, zoom: 11 },
      'صنعاء (مدينة)': { lat: 15.3694, lng: 44.1910, zoom: 12 },
      'سقطرى': { lat: 12.5000, lng: 53.8333, zoom: 9 },
    }

    return governorates[governorateName] || null
  }
}

// Export singleton instance
export const mapService = MapService.getInstance()
