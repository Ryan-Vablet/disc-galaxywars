export const SOUND_EFFECTS = {
  fleetLaunch: "fleetLaunch",
  fleetArriveReinforce: "fleetArriveReinforce",
  fleetArriveCombat: "fleetArriveCombat",
  planetCaptured: "planetCaptured",
  planetLost: "planetLost",
  victory: "victory",
  defeat: "defeat",
  uiClick: "uiClick",
  uiHover: "uiHover",
  selectPlanet: "selectPlanet",
} as const;

export type SoundEffect = (typeof SOUND_EFFECTS)[keyof typeof SOUND_EFFECTS];
