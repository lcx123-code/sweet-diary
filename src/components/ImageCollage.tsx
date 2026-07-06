import React from 'react'
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { radii } from '../theme'

export interface CollageImage {
  id: string
  uri: string
  width?: number
  height?: number
}

interface ImageCollageProps {
  images: CollageImage[]
  style?: ViewStyle
}

const GAP = 8

export function ImageCollage({ images, style }: ImageCollageProps) {
  if (images.length === 0) return null

  const visible = images.slice(0, 5)
  const extraCount = images.length - visible.length

  if (visible.length === 1) {
    return (
      <View style={[styles.single, style]}>
        <CollageImageView image={visible[0]} />
      </View>
    )
  }

  if (visible.length === 2) {
    return (
      <View style={[styles.row, style]}>
        {visible.map((image) => (
          <View key={image.id} style={styles.square}>
            <CollageImageView image={image} />
          </View>
        ))}
      </View>
    )
  }

  if (visible.length === 3) {
    return (
      <View style={[styles.threeGrid, style]}>
        <View style={styles.threeLarge}>
          <CollageImageView image={visible[0]} />
        </View>
        <View style={styles.threeStack}>
          <View style={styles.square}>
            <CollageImageView image={visible[1]} />
          </View>
          <View style={styles.square}>
            <CollageImageView image={visible[2]} />
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.grid, style]}>
      {visible.map((image, index) => (
        <View
          key={image.id}
          style={[
            styles.gridItem,
            visible.length === 5 && index === 4 && styles.gridItemWide,
          ]}
        >
          <CollageImageView image={image} overlay={index === 4 && extraCount > 0 ? `+${extraCount}` : undefined} />
        </View>
      ))}
    </View>
  )
}

function CollageImageView({ image, overlay }: { image: CollageImage; overlay?: string }) {
  return (
    <View style={styles.imageClip}>
      <Image source={{ uri: image.uri }} style={styles.image} resizeMode="cover" />
      {overlay && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>{overlay}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  single: {
    width: '100%',
    aspectRatio: 5 / 4,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  square: {
    flex: 1,
    aspectRatio: 1,
  },
  threeGrid: {
    flexDirection: 'row',
    gap: GAP,
  },
  threeLarge: {
    flex: 2,
    aspectRatio: 1,
  },
  threeStack: {
    flex: 1,
    gap: GAP,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  gridItem: {
    width: '48.8%',
    aspectRatio: 1,
  },
  gridItemWide: {
    width: '100%',
    aspectRatio: 2,
  },
  imageClip: {
    flex: 1,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(43,43,43,0.42)',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
  },
})
