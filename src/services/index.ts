/**
 * Services Index
 * 
 * Centralized export of all services
 */

export { MediaService, mediaService } from './media.service'
export type { UploadResult, VideoUploadResult, MediaType, ImageContext, ProcessingOptions } from './media.service'

export { WikiLinkService, wikiLinkService } from './wiki-link.service'
export type { TermMatch, LinkNode, ProcessedContent } from './wiki-link.service'

export { MapService, mapService } from './map.service'
export type { Coordinates, MapMarker, GeocodingResult, MapBounds } from './map.service'
