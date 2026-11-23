"use client";

import { useEffect, useRef, useState } from "react";

type PokemonSpriteProps = {
  pokemonId: number;
  name: string;
};

export default function PokemonSprite({ pokemonId, name }: PokemonSpriteProps) {
  const [usingHomeSprite, setUsingHomeSprite] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (!image?.complete || image.naturalWidth > 0) return;

    if (usingHomeSprite) {
      setUnavailable(true);
    } else {
      setUsingHomeSprite(true);
    }
  }, [usingHomeSprite]);

  if (unavailable) return null;

  return (
    <img
      ref={imageRef}
      className="pokemon-sprite pokemon-sprite-large"
      src={
        usingHomeSprite
          ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`
          : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemonId}.gif`
      }
      alt={`${name}${usingHomeSprite ? " sprite" : " animated sprite"}`}
      width={160}
      height={160}
      onError={() => {
        if (usingHomeSprite) {
          setUnavailable(true);
        } else {
          setUsingHomeSprite(true);
        }
      }}
    />
  );
}
