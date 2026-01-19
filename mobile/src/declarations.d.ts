declare module '*.png' {
  const content: number;
  export default content;
}

declare module '*.jpg' {
  const content: number;
  export default content;
}

declare module '*.jpeg' {
  const content: number;
  export default content;
}
declare module '*.webp' {
  const content: number;
  export default content;
}

declare module 'react-native'
declare module '@expo/vector-icons' {
  export const Ionicons: any
  const whatever: any
  export default whatever
}

declare module '@react-navigation/bottom-tabs' {
  export function createBottomTabNavigator<T = any>(): any
}

declare module '@react-navigation/native' {
  export type NavigationProp<T = any> = any
  export function useNavigation<T = any>(): any
}

declare module '@react-navigation/native-stack' {
  export function createNativeStackNavigator<T = any>(): any
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: any
  export default AsyncStorage
}

declare module '@react-native-picker/picker' {
  export const Picker: any
  export default Picker
}

declare module '*-untyped'

declare module '*.gltf' {
  const src: string;
  export default src;
}
