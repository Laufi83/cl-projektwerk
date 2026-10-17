/**
 * Ankunft der Messemonteure für alle Stand-Themen: Der Van fährt hinter dem Stand vor (parallel zur Rückwand), die
 * Vordertüren öffnen, zwei Monteure steigen aus, gehen um den Stand vor die Standfläche und beraten sich dort.
 */
import type { Built, Ctx } from "./engine";
import { at, van, walk, worker } from "./kit";

/** Van hinter der Rückwand (z = −3), Fahrtrichtung +x */
const VX = 0.6, VZ = -6.4;
/** Treffpunkt vor der offenen Standseite */
const MEET: [number, number][] = [[0.4, 4.3], [-0.5, 4.8]];

export function withCrew(ctx: Ctx, built: Built): Built {
  const v = van(ctx);
  v.g.position.set(VX, 0, VZ); v.g.rotation.y = Math.PI / 2;
  built.root.add(v.g);
  // Drehung um 90°: Fahrerseite (lokal +x) liegt bei −z (von der Rückwand weg), Beifahrerseite zur Rückwand
  const dx = VX + v.doorZ, zA = VZ - v.side - 0.3, zB = VZ + v.side + 0.3;
  const a = worker(built.root), b = worker(built.root, "#ff7a1a");
  const pathA: [number, number, number][] = [[6.3, dx - 0.5, zA], [6.8, dx, zA], [7.8, VX + v.front + 0.8, zA], [9.0, VX + v.front + 0.8, -4.2], [9.9, 2.8, -3.5], [12.3, 2.8, 3.7], [13.3, ...MEET[0]]];
  const pathB: [number, number, number][] = [[6.6, dx - 0.5, zB], [7.1, dx, zB], [7.8, 3.4, -4.3], [10.6, 3.4, 3.6], [11.8, ...MEET[1]]];
  const faceA = Math.atan2(MEET[1][0] - MEET[0][0], MEET[1][1] - MEET[0][1]);
  const faceB = Math.atan2(MEET[0][0] - MEET[1][0], MEET[0][1] - MEET[1][1]);
  const inner = built.update;
  const update = (t: number, dt: number) => {
    inner?.(t, dt);
    v.g.position.x = at([[0, -34], [5.5, VX]], t);
    const open = at([[0, 0], [5.6, 0], [6.3, 1], [8.0, 1], [8.8, 0]], t);
    v.door("fl", open); v.door("fr", open);
    a.g.visible = t > 6.2; b.g.visible = t > 6.5;
    walk(a, pathA, t, faceA); walk(b, pathB, t, faceB);
    // beraten: leichtes Zuwenden und Nicken
    if (t > 13.3) { a.g.rotation.y = faceA + Math.sin(t * 0.9) * 0.18; a.head.rotation.x = Math.max(0, Math.sin(t * 1.7)) * 0.18; }
    if (t > 11.8) { b.g.rotation.y = faceB + Math.sin(t * 0.7 + 1) * 0.15; b.head.rotation.x = Math.max(0, Math.sin(t * 1.3 + 2)) * 0.15; }
  };
  return { ...built, update, still: Math.max(built.still ?? 0, 14) };
}

