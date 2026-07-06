import { useEffect } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'

/**
 * + Tab 占位页
 * tabPress 事件已拦截并导航到 /write，这个页面不会真正展示
 */
export default function PlusPlaceholder() {
  useEffect(() => {
    router.replace('/write')
  }, [])

  return <View />
}
