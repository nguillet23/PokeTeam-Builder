"use client";

import { useState } from "react";
import { formatPokemonName, normalizeNameForSearch } from "../../../lib/display-names";

type PokemonOption = {
  pokemon_id: number;
  dex_number: number;
  name: string;
};

type PokemonPickerProps = {
  pokemon: PokemonOption[];
  selectedId?: string;
};

export default function PokemonPicker({ pokemon, selectedId }: PokemonPickerProps) {
  const selectedPokemon = pokemon.find((p) => String(p.pokemon_id) === selectedId);
  const [query, setQuery] = useState(
    selectedPokemon ? formatPokemonName(selectedPokemon.name) : "",
  );
  const [selectedPokemonId, setSelectedPokemonId] = useState(
    selectedPokemon ? String(selectedPokemon.pokemon_id) : "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedQuery = normalizeNameForSearch(query);
  const matchingPokemon = pokemon.filter(
    (p) =>
      normalizeNameForSearch(formatPokemonName(p.name)).includes(normalizedQuery) ||
      String(p.dex_number).includes(normalizedQuery),
  );
  const results = matchingPokemon.slice(0, 12);

  function choosePokemon(p: PokemonOption) {
    setQuery(formatPokemonName(p.name));
    setSelectedPokemonId(String(p.pokemon_id));
    setIsOpen(false);
    setActiveIndex(-1);
  }

  return (
    <form className="pokemon-picker-form" method="get">
      <div className="pokemon-picker">
        <label className="visually-hidden" htmlFor="pokemon-search">
          Search Pokémon
        </label>
        <input
          id="pokemon-search"
          type="search"
          autoComplete="off"
          placeholder="Search by name or Pokédex number"
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="pokemon-options"
          aria-activedescendant={
            isOpen && activeIndex >= 0 && results[activeIndex]
              ? `pokemon-option-${results[activeIndex].pokemon_id}`
              : undefined
          }
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedPokemonId("");
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((current) => Math.min(current + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((current) =>
                current <= 0 ? results.length - 1 : current - 1,
              );
            } else if (event.key === "Enter") {
              if (isOpen && results[activeIndex]) {
                event.preventDefault();
                choosePokemon(results[activeIndex]);
              } else if (!selectedPokemonId) {
                event.preventDefault();
              }
            } else if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
        />
        <input type="hidden" name="pick" value={selectedPokemonId} />
        {isOpen && (
          <ul className="pokemon-picker-options" id="pokemon-options" role="listbox">
            {results.length > 0 ? (
              results.map((p, index) => (
                <li
                  className={index === activeIndex ? "active" : ""}
                  id={`pokemon-option-${p.pokemon_id}`}
                  key={p.pokemon_id}
                  role="option"
                  aria-selected={selectedPokemonId === String(p.pokemon_id)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choosePokemon(p)}
                >
                  <span className="pokemon-picker-number">#{p.dex_number}</span>
                  {formatPokemonName(p.name)}
                </li>
              ))
            ) : (
              <li className="pokemon-picker-empty" role="status">
                No Pokémon found.
              </li>
            )}
            {matchingPokemon.length > results.length && (
              <li className="pokemon-picker-hint" role="presentation">
                Showing 12 results. Keep typing to narrow the list.
              </li>
            )}
          </ul>
        )}
      </div>
      <button disabled={!selectedPokemonId}>Choose</button>
    </form>
  );
}
