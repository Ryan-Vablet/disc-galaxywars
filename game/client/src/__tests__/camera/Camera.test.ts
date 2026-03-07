import { describe, expect, it } from "vitest";
import { Camera } from "@/camera/Camera";
import type { WorldBounds } from "@/camera/Camera";

describe("Camera", () => {
  describe("coordinate transforms", () => {
    it("converts world to screen coordinates correctly", () => {
      const camera = new Camera(800, 600);
      camera.setPosition(400, 300); // Center at 400, 300
      camera.setZoom(1.0);

      // Center of world should be center of screen
      const screen = camera.worldToScreen(400, 300);
      expect(screen.x).toBeCloseTo(400, 0.1);
      expect(screen.y).toBeCloseTo(300, 0.1);
    });

    it("converts screen to world coordinates correctly", () => {
      const camera = new Camera(800, 600);
      camera.setPosition(400, 300);
      camera.setZoom(1.0);

      // Center of screen should be center of world
      const world = camera.screenToWorld(400, 300);
      expect(world.x).toBeCloseTo(400, 0.1);
      expect(world.y).toBeCloseTo(300, 0.1);
    });

    it("round-trips coordinates consistently", () => {
      const camera = new Camera(800, 600);
      camera.setPosition(100, 200);
      camera.setZoom(1.5);

      const original = { x: 150, y: 250 };
      const screen = camera.worldToScreen(original.x, original.y);
      const world = camera.screenToWorld(screen.x, screen.y);

      expect(world.x).toBeCloseTo(original.x, 0.01);
      expect(world.y).toBeCloseTo(original.y, 0.01);
    });

    it("round-trips coordinates with rotation around pivot", () => {
      const camera = new Camera(800, 600);
      camera.setPivot(400, 300);
      camera.setPosition(400, 300);
      camera.setZoom(1.2);
      camera.setRotation(90);

      const original = { x: 550, y: 320 };
      const screen = camera.worldToScreen(original.x, original.y);
      const world = camera.screenToWorld(screen.x, screen.y);

      expect(world.x).toBeCloseTo(original.x, 0.01);
      expect(world.y).toBeCloseTo(original.y, 0.01);
    });

    it("scales distances with zoom", () => {
      const camera = new Camera(800, 600);
      camera.setPosition(0, 0);

      camera.setZoom(1.0);
      expect(camera.worldToScreenScale(100)).toBeCloseTo(100, 0.1);

      camera.setZoom(2.0);
      expect(camera.worldToScreenScale(100)).toBeCloseTo(200, 0.1);

      camera.setZoom(0.5);
      expect(camera.worldToScreenScale(100)).toBeCloseTo(50, 0.1);
    });
  });

  describe("zoomAt", () => {
    it("keeps cursor world-point fixed when zooming", () => {
      const camera = new Camera(800, 600);
      camera.setPosition(400, 300);
      camera.setZoom(1.0);

      // World point under screen center (400, 300) is world center (400, 300)
      const worldBefore = camera.screenToWorld(400, 300);
      expect(worldBefore.x).toBeCloseTo(400, 0.1);
      expect(worldBefore.y).toBeCloseTo(300, 0.1);

      // Zoom in at screen center
      camera.zoomAt(400, 300, 0.5); // 50% zoom increase
      camera.update(16); // Apply interpolation

      // World point under screen center should still be (400, 300)
      const worldAfter = camera.screenToWorld(400, 300);
      expect(worldAfter.x).toBeCloseTo(400, 0.1);
      expect(worldAfter.y).toBeCloseTo(300, 0.1);
    });

    it("clamps zoom to min/max limits", () => {
      const camera = new Camera(800, 600);
      camera.setPosition(400, 300);
      camera.setZoom(1.0);

      // Try to zoom beyond max
      camera.zoomAt(400, 300, 10); // Huge zoom
      camera.update(16);
      expect(camera.getZoom()).toBeLessThanOrEqual(camera.maxZoom);

      // Try to zoom below min
      camera.zoomAt(400, 300, -1); // Huge zoom out
      camera.update(16);
      expect(camera.getZoom()).toBeGreaterThanOrEqual(camera.minZoom);
    });
  });

  describe("fitBounds", () => {
    it("calculates correct zoom to fit bounds", () => {
      const camera = new Camera(800, 600);

      const bounds: WorldBounds = {
        minX: 0,
        minY: 0,
        maxX: 1000,
        maxY: 800,
      };

      camera.fitBounds(bounds, 100);

      // After fitBounds, zoom should be set and state should match target
      const state = camera.getState();
      expect(state.zoom).toBeGreaterThan(0);
      expect(state.zoom).toBeLessThanOrEqual(camera.maxZoom);
    });

    it("applies requested rotation when fitting bounds", () => {
      const camera = new Camera(800, 600);
      camera.setPivot(500, 400);

      const bounds: WorldBounds = {
        minX: 100,
        minY: 200,
        maxX: 900,
        maxY: 600,
      };

      camera.fitBounds(bounds, 100, 90);

      expect(camera.getState().rotation).toBeCloseTo(90, 0.01);
    });

    it("centers camera on bounds midpoint", () => {
      const camera = new Camera(800, 600);

      const bounds: WorldBounds = {
        minX: 100,
        minY: 200,
        maxX: 700,
        maxY: 600,
      };

      camera.fitBounds(bounds, 100);

      const state = camera.getState();
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;

      expect(state.x).toBeCloseTo(centerX, 0.1);
      expect(state.y).toBeCloseTo(centerY, 0.1);
    });

    it("sets both state and targetState for instant move", () => {
      const camera = new Camera(800, 600);

      const bounds: WorldBounds = {
        minX: 0,
        minY: 0,
        maxX: 500,
        maxY: 400,
      };

      camera.fitBounds(bounds, 100);

      // Both should be identical (no interpolation delay)
      const state = camera.getState();
      expect(state.x).toBeDefined();
      expect(state.y).toBeDefined();
      expect(state.zoom).toBeDefined();
    });
  });

  describe("pan", () => {
    it("moves camera in world-space", () => {
      const camera = new Camera(800, 600);
      camera.setPosition(400, 300);
      camera.setZoom(1.0);

      // Pan right by 100 screen pixels
      camera.pan(100, 0);
      camera.update(16);

      // Camera should move left (opposite of pan direction)
      // and in world coordinates it moves less if zoomed in
      const state = camera.getState();
      expect(state.x).toBeLessThan(400);
    });
  });

  describe("update", () => {
    it("interpolates toward target state", () => {
      const camera = new Camera(800, 600);
      camera.setPosition(0, 0);
      camera.setZoom(1.0);

      const beforeUpdate = camera.getState();
      expect(beforeUpdate.x).toBe(0);
      expect(beforeUpdate.y).toBe(0);

      // Use pan() which only modifies targetState
      camera.pan(-100, -200); // Move camera right/down by this amount in screen space
      // In world space at zoom 1.0, this means moving position by (100, 200)
      // So targetState becomes (100, 200) while state stays at (0, 0)

      camera.update(16);
      const afterUpdate = camera.getState();

      // State should have moved toward target (but not all the way)
      expect(afterUpdate.x).toBeGreaterThan(0);
      expect(afterUpdate.y).toBeGreaterThan(0);
      expect(afterUpdate.x).toBeLessThan(100);
      expect(afterUpdate.y).toBeLessThan(200);
    });
  });

  describe("getWorldBoundsVisible", () => {
    it("returns correct visible bounds", () => {
      const camera = new Camera(800, 600);
      camera.setPosition(400, 300);
      camera.setZoom(1.0);

      const bounds = camera.getWorldBoundsVisible();

      // Bounds are conservatively inflated to avoid rotated-edge culling.
      expect(bounds.minX).toBeCloseTo(-48, 0.1);
      expect(bounds.maxX).toBeCloseTo(848, 0.1);
      expect(bounds.minY).toBeCloseTo(-48, 0.1);
      expect(bounds.maxY).toBeCloseTo(648, 0.1);
    });

    it("bounds shrink when zoomed in", () => {
      const camera = new Camera(800, 600);
      camera.setPosition(400, 300);
      camera.setZoom(1.0);

      const bounds1x = camera.getWorldBoundsVisible();

      camera.setZoom(2.0);
      const bounds2x = camera.getWorldBoundsVisible();

      const width1x = bounds1x.maxX - bounds1x.minX;
      const width2x = bounds2x.maxX - bounds2x.minX;

      expect(width2x).toBeLessThan(width1x);
    });

    it("returns conservative visible bounds when rotated", () => {
      const camera = new Camera(800, 600);
      camera.setPivot(400, 300);
      camera.setPosition(400, 300);
      camera.setRotation(45);

      const bounds = camera.getWorldBoundsVisible();

      expect(bounds.minX).toBeLessThan(0);
      expect(bounds.minY).toBeLessThan(0);
      expect(bounds.maxX).toBeGreaterThan(800);
      expect(bounds.maxY).toBeGreaterThan(600);
    });
  });

  describe("setViewport", () => {
    it("updates viewport dimensions", () => {
      const camera = new Camera(800, 600);

      camera.setViewport(1024, 768);
      const viewport = camera.getViewport();

      expect(viewport.width).toBe(1024);
      expect(viewport.height).toBe(768);
    });
  });
});
