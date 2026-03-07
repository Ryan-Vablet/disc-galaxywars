import { AI_PERSONALITIES } from "@/constants/ai";
import type { AIPersonality } from "@/types/ai";
import type {
  FleetDispatchResult,
  FleetId,
  GameConfig,
  GameEvent,
  GameState,
  PlanetId,
  PlayerId,
} from "@/types/game";
import { BotAI } from "@/engine/ai/BotAI";
import { FleetDispatcher } from "@/engine/actions/FleetDispatcher";
import { MapGenerator } from "@/engine/map/MapGenerator";
import { FleetSystem } from "@/engine/systems/FleetSystem";
import { ProductionSystem } from "@/engine/systems/ProductionSystem";
import { GameStatsTracker, type SideStats } from "@/engine/GameStats";

type GameEventCallback = (event: GameEvent) => void;
type PendingAIDispatch = {
  action: { from: PlanetId; to: PlanetId; owner: PlayerId };
  executeAtTime: number;
};
type MapMetadata = {
  retryCount: number;
  mapSize: GameConfig["mapSize"];
  playerCount: number;
};

export class GameEngine {
  private state: GameState;
  private nextFleetIdValue = 0;
  private readonly fleetSystem: FleetSystem;
  private readonly productionSystem: ProductionSystem;
  private readonly dispatcher: FleetDispatcher;
  private readonly mapGenerator: MapGenerator;
  private readonly listeners = new Set<GameEventCallback>();
  private readonly aiControllers = new Map<PlayerId, BotAI>();
  private readonly pendingAIDispatches: PendingAIDispatch[] = [];
  private readonly playerId: PlayerId;
  private readonly botIds: PlayerId[];
  private readonly stats: GameStatsTracker;
  private readonly mapMetadata: MapMetadata;

  public constructor(config: GameConfig, difficulty: keyof typeof AI_PERSONALITIES) {
    this.playerId = config.playerId;
    this.botIds = Array.from({ length: config.botCount }, (_, idx) => (idx + 1) as PlayerId);
    this.mapGenerator = new MapGenerator();
    this.fleetSystem = new FleetSystem();
    this.productionSystem = new ProductionSystem();
    this.dispatcher = new FleetDispatcher({
      nextFleetId: () => this.nextFleetId(),
    });
    for (const botId of this.botIds) {
      this.aiControllers.set(botId, new BotAI(botId, AI_PERSONALITIES[difficulty] as AIPersonality));
    }
    this.stats = new GameStatsTracker([this.playerId, ...this.botIds]);
    this.state = this.createInitialState(config);
    this.mapMetadata = {
      retryCount: this.mapGenerator.getLastRetryCount(),
      mapSize: config.mapSize,
      playerCount: 1 + config.botCount,
    };
  }

  public tick(dtMs: number): void {
    if (this.state.status !== "playing") {
      return;
    }
    this.state.timeMs += dtMs;
    const before = this.state.planets.map((planet) => ({
      id: planet.id,
      units: planet.units,
      owner: planet.owner,
    }));
    this.productionSystem.tick(this.state, dtMs);
    for (const previous of before) {
      const current = this.state.planets.find((planet) => planet.id === previous.id);
      if (!current) {
        continue;
      }
      this.stats.recordProduction(current.owner, Math.max(0, current.units - previous.units));
    }
    const fleetEvents = this.fleetSystem.tick(this.state, dtMs);
    for (const event of fleetEvents) {
      this.emit(event);
    }

    this.drainPendingAIDispatches();

    for (const [botId, controller] of this.aiControllers.entries()) {
      const aiDecisions = controller.evaluate(this.state, dtMs);
      for (const aiDecision of aiDecisions) {
        if ((aiDecision.delayMs ?? 0) > 0) {
          this.pendingAIDispatches.push({
            action: { from: aiDecision.from, to: aiDecision.to, owner: botId },
            executeAtTime: this.state.timeMs + (aiDecision.delayMs ?? 0),
          });
        } else {
          this.dispatchFleet(aiDecision.from, aiDecision.to, botId);
        }
      }
    }

    this.updateGameOverState();
    this.stats.updateFrame(this.state);
  }

  public getState(): Readonly<GameState> {
    return this.state;
  }

  public dispatchFleet(fromId: PlanetId, toId: PlanetId, owner: PlayerId): FleetDispatchResult {
    const result = this.dispatcher.dispatch(this.state, fromId, toId, owner);
    if (result.ok && result.fleet) {
      const from = this.state.planets.find((p) => p.id === fromId);
      if (from) {
        this.emit({ type: "fleet_launched", fleet: result.fleet, from: { ...from } });
      }
    }
    return result;
  }

  public dispatchMultiFleet(
    fromIds: PlanetId[],
    toId: PlanetId,
    owner: PlayerId,
  ): FleetDispatchResult[] {
    const results: FleetDispatchResult[] = [];
    for (const fromId of fromIds) {
      results.push(this.dispatchFleet(fromId, toId, owner));
    }
    return results;
  }

  public on(callback: GameEventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public getStats(): { player: Readonly<SideStats>; enemy: Readonly<SideStats> } {
    const aggregateEnemy: SideStats = {
      gameDuration: 0,
      fleetsLaunched: 0,
      fleetsSent: 0,
      unitsProduced: 0,
      unitsLost: 0,
      unitsKilled: 0,
      planetsCaptured: 0,
      planetsLost: 0,
      peakPlanets: 0,
      peakUnits: 0,
    };
    for (const botId of this.botIds) {
      const botStats = this.stats.getStatsFor(botId);
      aggregateEnemy.gameDuration = Math.max(aggregateEnemy.gameDuration, botStats.gameDuration);
      aggregateEnemy.fleetsLaunched += botStats.fleetsLaunched;
      aggregateEnemy.fleetsSent += botStats.fleetsSent;
      aggregateEnemy.unitsProduced += botStats.unitsProduced;
      aggregateEnemy.unitsLost += botStats.unitsLost;
      aggregateEnemy.unitsKilled += botStats.unitsKilled;
      aggregateEnemy.planetsCaptured += botStats.planetsCaptured;
      aggregateEnemy.planetsLost += botStats.planetsLost;
      aggregateEnemy.peakPlanets += botStats.peakPlanets;
      aggregateEnemy.peakUnits += botStats.peakUnits;
    }
    return {
      player: this.stats.getStatsFor(this.playerId),
      enemy: aggregateEnemy,
    };
  }

  public getMapMetadata(): Readonly<MapMetadata> {
    return this.mapMetadata;
  }

  private emit(event: GameEvent): void {
    this.stats.recordEvent(event);
    for (const callback of this.listeners) {
      callback(event);
    }
  }

  private nextFleetId(): FleetId {
    this.nextFleetIdValue += 1;
    return this.nextFleetIdValue as FleetId;
  }

  private drainPendingAIDispatches(): void {
    for (let i = this.pendingAIDispatches.length - 1; i >= 0; i -= 1) {
      const pending = this.pendingAIDispatches[i];
      if (!pending || pending.executeAtTime > this.state.timeMs) {
        continue;
      }
      this.dispatchFleet(pending.action.from, pending.action.to, pending.action.owner);
      this.pendingAIDispatches.splice(i, 1);
    }
  }

  private createInitialState(config: GameConfig): GameState {
    return {
      planets: this.mapGenerator.generate({
        playerIds: [this.playerId, ...this.botIds],
        mapSize: config.mapSize,
        homeUnits: config.homeUnits,
      }),
      fleets: [],
      players: [{ id: this.playerId, name: "You", isBot: false }, ...this.botIds.map((id, idx) => ({ id, name: `Bot ${idx + 1}`, isBot: true }))],
      status: "playing",
      winner: null,
      timeMs: 0,
    };
  }

  private updateGameOverState(): void {
    const playerPlanets = this.state.planets.filter((p) => p.owner === this.playerId).length;
    const playerFleets = this.state.fleets.filter((f) => f.owner === this.playerId).length;
    const hostilePlanets = this.state.planets.filter(
      (p) => p.owner !== null && p.owner !== this.playerId,
    ).length;
    const hostileFleets = this.state.fleets.filter((f) => f.owner !== this.playerId).length;

    if (playerPlanets === 0 && playerFleets === 0) {
      this.state.status = "defeat";
      this.state.winner = this.botIds[0] ?? (1 as PlayerId);
      this.emit({ type: "game_over", winner: this.state.winner });
      return;
    }

    if (hostilePlanets === 0 && hostileFleets === 0) {
      this.state.status = "victory";
      this.state.winner = this.playerId;
      this.emit({ type: "game_over", winner: this.playerId });
    }
  }
}
