import { useSphere } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { createRef, memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DynamicDrawUsage, ExtrudeGeometry, Matrix4, MeshNormalMaterial } from "three";

import type { Triplet } from "@react-three/cannon";
import type { RefObject, JSX } from "react";
import type { ColorRepresentation, InstancedMesh } from "three";

import { chars, getCenter, isChar, shapes } from './font';
import { useLibrary } from './tomes/provider';

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
const letterScratch = new Array(chars.length).fill(0);

function UserComponent({ color, name, number, offset, position = [0, 0, 0], size, userId }: UserProps): JSX.Element {
  const library = useLibrary();

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
  const [letters, setLetters] = useState(new Array(number).fill("0").map((_, i) => filteredName[i % name.length]))
  const letterCount = useRef<number[]>(letters.reduce((agg, char) => {
    agg[chars.indexOf(char)] += 1;
    return agg;
  }, new Array(chars.length).fill(0)));

  const refMap = chars.reduce((agg, char) => ({ ...agg, [char]: createRef<InstancedMesh>() }), {} as Record<
    Char,
    RefObject<InstancedMesh | null>
  >);

  useEffect(() => {
    if (!library.chats.tome[userId]) return console.warn('we got no chats');

    const updateChat = () => {
      const tChat = library.chats.tome[userId];

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

      const prevChar = letters[index.current];
      const prevLetterRef = refMap[prevChar];

      const prevCharIndex = chars.indexOf(prevChar);
      const charIndex = chars.indexOf(char);

      if (prevLetterRef.current && prevChar !== char) {
        const prevCharCount = Math.max(letterCount.current[prevCharIndex] - 1, 0);
        const charCount = Math.min(letterCount.current[charIndex] + 1, number);

        letterCount.current[prevCharIndex] = prevCharCount;
        letterCount.current[charIndex] = charCount;

        prevLetterRef.current.count = prevCharCount;
        refMap[char].current!.count = charCount;

        console.log('after', prevChar, prevLetterRef.current.count, char, charCount, letterCount.current[charIndex]);
      }

      at(index.current).position.set(
        position[0] - 10 + word.current * size * 2.1 + Math.random() * size * 0.5,
        position[1] + 10,
        position[2] + Math.random() + offset * size * 2.1
      );
      at(index.current).angularVelocity.set(0, 0, 0);
      at(index.current).velocity.set(0, 0, 0);
      at(index.current).mass.set(0);
      at(index.current).sleep();

      setLetters(v => {
        v[index.current] = char;
        return v;
      });

      index.current = (index.current + 1) % number;

      word.current += 1;
    };

    library.chats.tome[userId].addListener('readable', updateChat);

    return () => {
      library.chats.tome[userId].removeListener('readable', updateChat);
    };
  }, [library]);

  useFrame(() => {
    letterScratch.fill(0);

    for (let i = 0; i < number; i += 1) {
      const char = letters[i];

      if (!refMap[char]?.current || !ref.current) return;

      ref.current.getMatrixAt(i, m);
      pm.copyPosition(m);

      const countIndex = chars.indexOf(char);

      refMap[char].current.setMatrixAt(letterScratch[countIndex], pm);
      refMap[char].current.instanceMatrix.needsUpdate = true;

      letterScratch[countIndex] += 1;
    }
  });

  return (
    <group>
      {chars.map((char) => (
        <instancedMesh
          args={[new ExtrudeGeometry(shapes[char], { bevelSize: 0, depth: 0.1 }), new MeshNormalMaterial(), number]}
          count={letterCount.current[chars.indexOf(char)]}
          key={`${char}-${userId}`}
          name={`${char}-${userId}`}
          position={[
            0 - getCenter(char),
            -0.25,
            0,
          ]}
          ref={refMap[char]}
        />
      ))}
      <instancedMesh
        args={[undefined, undefined, number]}
        castShadow
        ref={ref}
      >
        <sphereGeometry args={[size, 48]} />
        <meshLambertMaterial color={color} opacity={0.4} transparent />
      </instancedMesh>
    </group>
  );
}

export const User = memo(UserComponent);
