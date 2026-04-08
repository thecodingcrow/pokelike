// ITEM_POOL and USABLE_ITEM_POOL — all held items and usable items with effects

export interface Item {
  id: string;
  name: string;
  desc: string;
  icon: string;
  minMap?: number;
  usable?: boolean;
}

export const ITEM_POOL: Item[] = [
  { id: 'lucky_egg',          name: 'Lucky Egg',          desc: 'Holder gains +1 extra level after winning wild battles',             icon: '🥚', minMap: 4 },
  { id: 'life_orb',           name: 'Life Orb',           desc: '+30% damage; holder loses 10% max HP per hit',                       icon: '🔮' },
  { id: 'choice_band',        name: 'Choice Band',        desc: '+40% physical damage, -20% DEF',                                     icon: '🎀' },
  { id: 'choice_specs',       name: 'Choice Specs',       desc: '+40% special damage, -20% Sp.Def',                                   icon: '👓' },
  { id: 'muscle_band',        name: 'Muscle Band',        desc: '+50% ATK & DEF if your whole team are physical attackers',           icon: '💪' },
  { id: 'wise_glasses',       name: 'Wise Glasses',       desc: '+50% Sp.Atk & Sp.Def if your whole team are special attackers',      icon: '🔍' },
  { id: 'metronome',          name: 'Metronome',          desc: '+50% damage if every Pokémon on your team shares a type',            icon: '🎵' },
  { id: 'scope_lens',         name: 'Scope Lens',         desc: '20% crit chance (+50% damage on crit)',                              icon: '🔭' },
  { id: 'rocky_helmet',       name: 'Rocky Helmet',       desc: 'Attacker takes 15% of their max HP on each hit',                     icon: '⛑️' },
  { id: 'shell_bell',         name: 'Shell Bell',         desc: 'Heal 25% of damage dealt',                                           icon: '🐚' },
  { id: 'eviolite',           name: 'Eviolite',           desc: '+50% DEF & Sp.Def if holder is not fully evolved',                   icon: '💎' },
  { id: 'sharp_beak',         name: 'Sharp Beak',         desc: '+50% Flying move damage',                                            icon: '🦅' },
  { id: 'charcoal',           name: 'Charcoal',           desc: '+50% Fire move damage',                                              icon: '🔥' },
  { id: 'mystic_water',       name: 'Mystic Water',       desc: '+50% Water move damage',                                             icon: '💧' },
  { id: 'magnet',             name: 'Magnet',             desc: '+50% Electric move damage',                                          icon: '🧲', minMap: 4 },
  { id: 'miracle_seed',       name: 'Miracle Seed',       desc: '+50% Grass move damage',                                             icon: '🌱' },
  { id: 'twisted_spoon',      name: 'Twisted Spoon',      desc: '+50% Psychic move damage',                                           icon: '🥄', minMap: 4 },
  { id: 'black_belt',         name: 'Black Belt',         desc: '+50% Fighting move damage',                                          icon: '🥋' },
  { id: 'soft_sand',          name: 'Soft Sand',          desc: '+50% Ground move damage',                                            icon: '🏖️', minMap: 4 },
  { id: 'silver_powder',      name: 'Silver Powder',      desc: '+50% Bug move damage',                                               icon: '🐛' },
  { id: 'hard_stone',         name: 'Hard Stone',         desc: '+50% Rock move damage',                                              icon: '🪨', minMap: 4 },
  { id: 'dragon_fang',        name: 'Dragon Fang',        desc: '+50% Dragon move damage',                                            icon: '🐉', minMap: 6 },
  { id: 'poison_barb',        name: 'Poison Barb',        desc: '+50% Poison move damage',                                            icon: '☠️', minMap: 4 },
  { id: 'spell_tag',          name: 'Spell Tag',          desc: '+50% Ghost move damage',                                             icon: '👻', minMap: 4 },
  { id: 'silk_scarf',         name: 'Silk Scarf',         desc: '+50% Normal move damage',                                            icon: '🤍' },
  // Stat items
  { id: 'assault_vest',       name: 'Assault Vest',       desc: '+50% Sp.Def',                                                        icon: '🦺' },
  { id: 'choice_scarf',       name: 'Choice Scarf',       desc: '+50% Speed',                                                         icon: '🧣' },
  // Battle effect items
  { id: 'leftovers',          name: 'Leftovers',          desc: 'Restore 6% max HP per turn',                                         icon: '🍃' },
  { id: 'expert_belt',        name: 'Expert Belt',        desc: '+20% damage on super effective hits',                                 icon: '🥊' },
  { id: 'focus_band',         name: 'Focus Band',         desc: '10% chance to survive a KO with 1 HP',                               icon: '🎗️' },
  { id: 'razor_claw',         name: 'Razor Claw',         desc: '20% crit chance (+50% damage on crit)',                               icon: '🗡️' },
  { id: 'air_balloon',        name: 'Air Balloon',        desc: 'Immune to Ground-type moves',                                         icon: '🎈' },
];

export const USABLE_ITEM_POOL: Item[] = [
  { id: 'max_revive', name: 'Max Revive', desc: 'Fully revives a fainted Pokémon',             icon: '💊', usable: true },
  { id: 'rare_candy', name: 'Rare Candy', desc: 'Gives a Pokémon +3 levels',                   icon: '🍬', usable: true },
  { id: 'moon_stone', name: 'Moon Stone', desc: 'Force evolves a Pokémon regardless of level',  icon: '🌙', usable: true },
];

