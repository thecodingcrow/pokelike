// TYPE_CHART — 18×17 effectiveness matrix (attacking type → defending type → multiplier)
// Fairy type is not present (Gen 1 scope)
export const TYPE_CHART: Record<string, Record<string, number>> = {
  //          Defending type →
  Normal:   { Normal:1,   Fire:1,   Water:1,   Electric:1,   Grass:1,   Ice:1,   Fighting:1,   Poison:1,   Ground:1, Flying:1,   Psychic:1,   Bug:1,   Rock:0.5, Ghost:0,   Dragon:1,   Dark:1,   Steel:0.5 },
  Fire:     { Normal:1,   Fire:0.5, Water:0.5, Electric:1,   Grass:2,   Ice:2,   Fighting:1,   Poison:1,   Ground:1, Flying:1,   Psychic:1,   Bug:2,   Rock:0.5, Ghost:1,   Dragon:0.5, Dark:1,   Steel:2   },
  Water:    { Normal:1,   Fire:2,   Water:0.5, Electric:1,   Grass:0.5, Ice:1,   Fighting:1,   Poison:1,   Ground:2, Flying:1,   Psychic:1,   Bug:1,   Rock:2,   Ghost:1,   Dragon:0.5, Dark:1,   Steel:1   },
  Electric: { Normal:1,   Fire:1,   Water:2,   Electric:0.5, Grass:0.5, Ice:1,   Fighting:1,   Poison:1,   Ground:0, Flying:2,   Psychic:1,   Bug:1,   Rock:1,   Ghost:1,   Dragon:0.5, Dark:1,   Steel:1   },
  Grass:    { Normal:1,   Fire:0.5, Water:2,   Electric:1,   Grass:0.5, Ice:1,   Fighting:1,   Poison:0.5, Ground:2, Flying:0.5, Psychic:1,   Bug:0.5, Rock:2,   Ghost:1,   Dragon:0.5, Dark:1,   Steel:0.5 },
  Ice:      { Normal:1,   Fire:0.5, Water:0.5, Electric:1,   Grass:2,   Ice:0.5, Fighting:1,   Poison:1,   Ground:2, Flying:2,   Psychic:1,   Bug:1,   Rock:1,   Ghost:1,   Dragon:2,   Dark:1,   Steel:0.5 },
  Fighting: { Normal:2,   Fire:1,   Water:1,   Electric:1,   Grass:1,   Ice:2,   Fighting:1,   Poison:0.5, Ground:1, Flying:0.5, Psychic:0.5, Bug:0.5, Rock:2,   Ghost:0,   Dragon:1,   Dark:2,   Steel:2   },
  Poison:   { Normal:1,   Fire:1,   Water:1,   Electric:1,   Grass:2,   Ice:1,   Fighting:1,   Poison:0.5, Ground:0.5, Flying:1, Psychic:1,   Bug:1,   Rock:0.5, Ghost:0.5, Dragon:1,   Dark:1,   Steel:0   },
  Ground:   { Normal:1,   Fire:2,   Water:1,   Electric:2,   Grass:0.5, Ice:1,   Fighting:1,   Poison:2,   Ground:1, Flying:0,   Psychic:1,   Bug:0.5, Rock:2,   Ghost:1,   Dragon:1,   Dark:1,   Steel:2   },
  Flying:   { Normal:1,   Fire:1,   Water:1,   Electric:0.5, Grass:2,   Ice:1,   Fighting:2,   Poison:1,   Ground:1, Flying:1,   Psychic:1,   Bug:2,   Rock:0.5, Ghost:1,   Dragon:1,   Dark:1,   Steel:0.5 },
  Psychic:  { Normal:1,   Fire:1,   Water:1,   Electric:1,   Grass:1,   Ice:1,   Fighting:2,   Poison:2,   Ground:1, Flying:1,   Psychic:0.5, Bug:1,   Rock:1,   Ghost:1,   Dragon:1,   Dark:0,   Steel:0.5 },
  Bug:      { Normal:1,   Fire:0.5, Water:1,   Electric:1,   Grass:2,   Ice:1,   Fighting:0.5, Poison:0.5, Ground:1, Flying:0.5, Psychic:2,   Bug:1,   Rock:1,   Ghost:0.5, Dragon:1,   Dark:2,   Steel:0.5 },
  Rock:     { Normal:1,   Fire:2,   Water:1,   Electric:1,   Grass:1,   Ice:2,   Fighting:0.5, Poison:1,   Ground:0.5, Flying:2, Psychic:1,   Bug:2,   Rock:1,   Ghost:1,   Dragon:1,   Dark:1,   Steel:0.5 },
  Ghost:    { Normal:0,   Fire:1,   Water:1,   Electric:1,   Grass:1,   Ice:1,   Fighting:0,   Poison:1,   Ground:1, Flying:1,   Psychic:2,   Bug:1,   Rock:1,   Ghost:2,   Dragon:1,   Dark:0.5, Steel:0.5 },
  Dragon:   { Normal:1,   Fire:1,   Water:1,   Electric:1,   Grass:1,   Ice:1,   Fighting:1,   Poison:1,   Ground:1, Flying:1,   Psychic:1,   Bug:1,   Rock:1,   Ghost:1,   Dragon:2,   Dark:1,   Steel:0.5 },
  Dark:     { Normal:1,   Fire:1,   Water:1,   Electric:1,   Grass:1,   Ice:1,   Fighting:0.5, Poison:1,   Ground:1, Flying:1,   Psychic:2,   Bug:1,   Rock:1,   Ghost:2,   Dragon:1,   Dark:0.5, Steel:0.5 },
  Steel:    { Normal:1,   Fire:0.5, Water:0.5, Electric:0.5, Grass:1,   Ice:2,   Fighting:1,   Poison:1,   Ground:1, Flying:1,   Psychic:1,   Bug:1,   Rock:2,   Ghost:1,   Dragon:1,   Dark:1,   Steel:0.5 },
};

// PokeAPI type ID map for type icon sprites
export const TYPE_IDS: Record<string, number> = {
  Normal:1, Fighting:2, Flying:3, Poison:4, Ground:5, Rock:6, Bug:7, Ghost:8, Steel:9,
  Fire:10, Water:11, Grass:12, Electric:13, Psychic:14, Ice:15, Dragon:16, Dark:17,
};
