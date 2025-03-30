import { Canvas } from "@react-three/fiber";
import { Physics, usePlane } from "@react-three/cannon";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useRef } from "react";

import type { PlaneProps } from "@react-three/cannon";
import type { Camera, Mesh } from "three";

import { SockMongerProvider } from "./sockmonger";
import { Users } from "./users";

function Ground(props: PlaneProps): JSX.Element {
  const [ref] = usePlane(() => props, useRef<Mesh>(null));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[1000, 1000]} />
      <meshLambertMaterial color="#ccc" />
      <shadowMaterial color="#a09" />
    </mesh>
  );
}

const server = undefined //'wss://chat.bjornstar.com:8081';

export default function App(): JSX.Element {
  const number = Math.pow(3, 3);
  const size = 1;
  const cameraRef = useRef<Camera>(null);

  return (
    <Canvas camera={{ fov: 50, position: [-10, 10, 25] }}>
      <SockMongerProvider server={server}>
        <color attach="background" args={["#ccc"]} />
        <PerspectiveCamera ref={cameraRef} position={[0, 0, 5]} />
        <OrbitControls camera={cameraRef.current} maxDistance={100} maxPolarAngle={Math.PI / 2} />
        <ambientLight intensity={0.1} />
        <hemisphereLight intensity={0.4} />
        <spotLight
          position={[15, 15, 15]}
          angle={0.3}
          penumbra={1}
          intensity={2}
        />
        <Physics allowSleep defaultContactMaterial={{ friction: 20 }} gravity={[0, -30, 0]}>
          <Users number={number} size={size} />
          <Ground rotation={[-Math.PI / 2, 0, 0]} />
        </Physics>
      </SockMongerProvider>
    </Canvas>
  );
}
