/**
 * Custom Map Extension for TipTap
 * 
 * Features:
 * - OpenStreetMap/Leaflet integration
 * - Coordinate picker
 * - Label support
 * - Responsive sizing
 */

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { MapBlockView } from '../blocks/MapBlockView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mapBlock: {
      /**
       * Insert a map block
       */
      insertMapBlock: (attrs: {
        lat: number
        lng: number
        zoom: number
        label?: string
        width?: number
        height?: number
      }) => ReturnType
      /**
       * Update map block attributes
       */
      updateMapBlock: (attrs: Partial<{
        lat: number
        lng: number
        zoom: number
        label: string
        width: number
        height: number
      }>) => ReturnType
      /**
       * Delete the map block
       */
      deleteMapBlock: () => ReturnType
    }
  }
}

export interface MapBlockOptions {
  HTMLAttributes: Record<string, any>
}

export const MapBlock = Node.create<MapBlockOptions>({
  name: 'mapBlock',
  
  group: 'block',
  
  atom: true,
  
  draggable: true,
  
  selectable: true,
  
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'map-block',
      },
    }
  },
  
  addAttributes() {
    return {
      lat: {
        default: 15.5527, // Yemen center
        parseHTML: element => parseFloat(element.getAttribute('data-lat') || '15.5527'),
        renderHTML: attributes => ({
          'data-lat': attributes.lat,
        }),
      },
      
      lng: {
        default: 48.5164, // Yemen center
        parseHTML: element => parseFloat(element.getAttribute('data-lng') || '48.5164'),
        renderHTML: attributes => ({
          'data-lng': attributes.lng,
        }),
      },
      
      zoom: {
        default: 10,
        parseHTML: element => parseInt(element.getAttribute('data-zoom') || '10'),
        renderHTML: attributes => ({
          'data-zoom': attributes.zoom,
        }),
      },
      
      label: {
        default: '',
        parseHTML: element => element.getAttribute('data-label') || '',
        renderHTML: attributes => {
          if (!attributes.label) return {}
          return {
            'data-label': attributes.label,
          }
        },
      },
      
      width: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('data-width')
          return width ? parseInt(width) : null
        },
      },
      
      height: {
        default: 400,
        parseHTML: element => {
          const height = element.getAttribute('data-height')
          return height ? parseInt(height) : 400
        },
        renderHTML: attributes => ({
          'data-height': attributes.height,
        }),
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="map-block"]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const { lat, lng, zoom, label, height } = node.attrs
    
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'map-block',
        'data-lat': lat,
        'data-lng': lng,
        'data-zoom': zoom,
        'data-label': label,
        'data-height': height,
        class: 'map-block',
      }),
      [
        'iframe',
        {
          src: `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`,
          width: '100%',
          height: height || 400,
          style: 'border: 0; border-radius: 8px;',
          loading: 'lazy',
        },
      ],
    ]
  },
  
  addNodeView() {
    // @ts-expect-error - ReactNodeViewRenderer type mismatch is expected
    return ReactNodeViewRenderer(MapBlockView)
  },
  
  addCommands() {
    return {
      insertMapBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
      
      updateMapBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attrs)
        },
      
      deleteMapBlock:
        () =>
        ({ commands }) => {
          return commands.deleteSelection()
        },
    }
  },
})

export default MapBlock
