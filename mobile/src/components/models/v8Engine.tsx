import * as THREE from 'three'
import React, { useRef, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import modelUrl from '../../../models/v8_engine/scene.gltf?url'

type GLTFResult = GLTF & {
  nodes: any
  materials: any
}

interface V8EngineProps {
  onPartsLoaded?: (parts: string[]) => void
  highlightedPart?: string[] | string | null 
  [key: string]: any
}

export function V8Engine(props: V8EngineProps) {
  const gltf = useGLTF(modelUrl) as unknown as GLTFResult
  const { scene } = gltf
  const sceneRef = useRef<THREE.Group | null>(null)
  const partGroupsMap = useRef<Map<string, THREE.Mesh[]>>(new Map())
  const [initialized, setInitialized] = useState(false)
  const { onPartsLoaded, highlightedPart, ...groupProps } = props

  // 1. Inicjalizacja: Głębokie przeszukiwanie modelu i klonowanie materiałów
  useEffect(() => {
    if (!scene || initialized) return

    const technicalPartNames: string[] = []
    
    scene.traverse((child) => {
      // Szukamy obiektów, które mają bezpośrednio pod sobą meshe (to są nasze części techniczne)
      const meshes: THREE.Mesh[] = []
      child.children.forEach(c => {
        if (c instanceof THREE.Mesh) meshes.push(c)
      })

      if (meshes.length > 0 && child.name && !child.name.includes('GLTF') && !child.name.includes('Root')) {
        if (!technicalPartNames.includes(child.name)) technicalPartNames.push(child.name)
        
        // Klonujemy materiały dla każdego mesha w tej części
        meshes.forEach(m => {
          if (m.material) {
            m.material = (m.material as THREE.Material).clone()
          }
        })
        
        partGroupsMap.current.set(child.name, meshes)
      }
    })

    scene.rotation.set(-Math.PI / 2, 0, 0)
    setInitialized(true)
    onPartsLoaded?.(technicalPartNames)
  }, [scene, initialized, onPartsLoaded])

  // 2. Logika podświetlania (obsługuje tablicę nazw technicznych)
  useEffect(() => {
    if (!initialized) return

    const selectedArray = Array.isArray(highlightedPart) 
      ? highlightedPart 
      : highlightedPart ? [highlightedPart] : []

    partGroupsMap.current.forEach((meshes, partName) => {
      const isSelected = selectedArray.includes(partName)

      meshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (!mat) return

        if (selectedArray.length > 0) {
          if (isSelected) {
            // Pomarańczowy blask dla wybranych
            mat.color.set(0xff6600)
            mat.emissive.set(0xff6600)
            mat.emissiveIntensity = 2.5
            mat.opacity = 1.0
            mat.transparent = false
          } else {
            // Przyciemnienie reszty (duch)
            mat.color.set(0x222222)
            mat.emissive.set(0x000000)
            mat.emissiveIntensity = 0
            mat.opacity = 0.15
            mat.transparent = true
          }
        } else {
          // Stan domyślny
          mat.color.set(0xffffff)
          mat.emissive.set(0x0a0a0a)
          mat.emissiveIntensity = 0.5
          mat.opacity = 1.0
          mat.transparent = false
        }
        mat.needsUpdate = true
      })
    })
  }, [highlightedPart, initialized])

  return (
    <group {...groupProps} dispose={null}>
      <primitive object={scene} ref={sceneRef} />
    </group>
  )
}

useGLTF.preload(modelUrl)
export default V8Engine