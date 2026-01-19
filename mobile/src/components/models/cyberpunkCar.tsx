import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import modelUrl from '../../../models/cyberpunk_car/scene.gltf?url'

type GLTFResult = GLTF & {
  nodes: {
    cb_car_export_cb_car_0: THREE.Mesh
  }
  materials: {
    cb_car: THREE.MeshStandardMaterial
  }
}

export function CyberpunkCar(props: any) {
  const { nodes, materials } = useGLTF(modelUrl) as unknown as GLTFResult
  const meshRef = useRef<THREE.Mesh | null>(null)

  useEffect(() => {
    try {
      const mat = (materials as any)?.cb_car as THREE.MeshStandardMaterial | undefined
      if (mat) {
        mat.roughness = 0.35
        mat.metalness = 0.95
        ;(mat as any).envMapIntensity = 1.6
        mat.emissive = new THREE.Color(0x0a0a0a)
        mat.emissiveIntensity = 0.5
        mat.needsUpdate = true
      }
    } catch (e) {
      // ignore
    }
  }, [materials])

  return (
    <group {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, -Math.PI]}>
        <group rotation={[Math.PI / 2, 0, 0]} scale={0.03}>
          <mesh
            ref={meshRef}
            castShadow
            receiveShadow
            geometry={nodes.cb_car_export_cb_car_0.geometry}
            material={materials.cb_car}
            rotation={[-Math.PI, 0, 0]}
            scale={160}
          />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload(modelUrl)

export default CyberpunkCar