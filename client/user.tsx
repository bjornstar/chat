import { useSphere } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { createRef, memo, useEffect, useRef } from "react";
import { Matrix4, MeshBasicMaterial } from "three";
import { TextGeometry } from "three-stdlib";

import type { Triplet } from "@react-three/cannon";
import type { MutableRefObject } from "react";
import type { ColorRepresentation, InstancedMesh } from "three";

import { chars, font, getWidth, isChar } from './font';
import { useTome } from './tomes';

import type { Char } from './font';

interface UserProps {
  color: ColorRepresentation;
  name: string;
  number: number;
  offset: number;
  position?: Triplet;
  size: number;
  userId: string;
}

const m = new Matrix4();
const pm = new Matrix4();
const home = new Matrix4().setPosition(-999, -999, -999);

function UserComponent({ color, name, number, offset, position = [0, 0, 0], size, userId }: UserProps): JSX.Element {
  const tChat = useTome('chats')[userId];

  const [ref, { at }] = useSphere((i) => {
    const j = i % 4;
    const k = Math.floor(i / 4) % 4;
    const l = Math.floor(i / 16) % 16;

    const x = position[0] + j * 2.1 + Math.random();
    const y = position[1] + k * 2.1 + Math.random();
    const z = position[2] + l * 2.1 + Math.random();

    return {
      args: [size],
      mass: 1,
      position: [x, y, z],
    };
  }, useRef<InstancedMesh>(null));

  const filteredName = name.toUpperCase().split('').filter(isChar);

  const index = useRef(0);
  const word = useRef(0);
  const letters = useRef<Char[]>(new Array(number).fill("0").map((_, i) => filteredName[i % name.length]));

  const refMap: Record<Char, MutableRefObject<InstancedMesh> | null> = {} as Record<
    Char,
    MutableRefObject<InstancedMesh> | null
  >;

  for (const char of chars) {
    refMap[char] = createRef<InstancedMesh>();
  }

  useEffect(() => {
    const updateChat = () => {
      const prevLetterRef = refMap[letters.current[index.current]];

      if (prevLetterRef?.current) {
        prevLetterRef.current.setMatrixAt(index.current, home);
        prevLetterRef.current.instanceMatrix.needsUpdate = true;
      }

      if (!tChat.length) {
        for (let i = 0; i < Math.min(word.current, number); i += 1) {
          const value = (number + index.current - i - 1) % number;
          at(value).mass.set(1);
          at(value).wakeUp();
        }
        word.current = 0;
        return;
      }

      const char = tChat[tChat.length - 1].toUpperCase();

      if (!isChar(char)) return;

      at(index.current).position.set(
        position[0] - 10 + word.current * size * 2.1 + Math.random() * size * 0.5,
        position[1] + 10,
        position[2] + Math.random() + offset * size * 2.1
      );
      at(index.current).angularVelocity.set(0, 0, 0);
      at(index.current).velocity.set(0, 0, 0);
      at(index.current).mass.set(0);
      at(index.current).sleep();

      letters.current[index.current] = char;

      index.current = (index.current + 1) % number;

      word.current += 1;
    };

    Object.values(refMap).forEach((letterRef) => {
      console.log(letterRef?.current)
      if (!letterRef) return;
      letterRef.current.setMatrixAt(index.current, home);
      letterRef.current.instanceMatrix.needsUpdate = true;
    });

    return () => tChat.removeListener('readable', updateChat);
  }, [tChat]);

  useFrame(() => {
    for (let i = 0; i < number; i += 1) {
      const letter = letters.current[i];

      if (!refMap[letter]?.current || !ref.current) return;

      ref.current.getMatrixAt(i, m);
      pm.copyPosition(m);

      refMap[letter].current.setMatrixAt(i, pm);
      refMap[letter].current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {chars.map((char) => (
        <instancedMesh
          args={[
            new TextGeometry(char, { font, height: 0.1, size: 0.75 }),
            new MeshBasicMaterial(),
            number,
          ]}
          key={`${char}-${userId}`}
          name={`${char}-${userId}`}
          position={[
            -0.4 - (getWidth(char) - 711) / 2000,
            -0.25,
            0.25,
          ]}
          ref={refMap[char]}
        />
      ))}
      <instancedMesh
        args={[undefined, undefined, number]}
        castShadow
        receiveShadow
        ref={ref}
      >
        <sphereGeometry args={[size, 48]} />
        <meshLambertMaterial color={color} opacity={0.4} transparent />
      </instancedMesh>
    </group>
  );
}

export const User = memo(UserComponent);
