import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { checkStand } from "../../src/lib/expo-intelligence/stand-check.ts";
import type { Venue } from "../../src/lib/expo-intelligence/types.ts";

const file = path.join(import.meta.dirname, "../../src/data/messebau/venues.global.v1.json");
const data = JSON.parse(fs.readFileSync(file, "utf8")) as { venues: { index: number; id: string; slug: string; legacy: { guide: unknown } }[] };
assert.equal(data.venues.length, 101, "101 venues required");
assert.equal(new Set(data.venues.map(v=>v.slug)).size, 101, "unique slugs");
for (let i=1;i<=101;i++) assert.ok(data.venues.some(v=>v.index===i&&v.id===`venue-${String(i).padStart(3,"0")}`), `missing index ${i}`);
// die bisherigen 50 Europa-Gelände bleiben mit ihrer Nummer 1–50 und ihrem Steckbrief erhalten (Atlas, Kompass)
for (let i=1;i<=50;i++) assert.ok(data.venues.find(v=>v.index===i)?.legacy.guide, `legacy venue ${i} lost`);

const base: Venue = { id: "venue-001", name: "Test", city: "Test", country: "Test", continent: "europe", technical: {}, sources: [] };
const input = { venueId: "venue-001", widthM: 6, depthM: 4, heightM: 7, doubleDeck: false };
assert.equal(checkStand(base,input).status,"needs-review","missing rules never green");
const tentative: Venue = { ...base, technical: { maximumConstructionHeight: { value: 6.5, status: "unverified" } } };
assert.equal(checkStand(tentative,input).status,"needs-review","unverified height cannot cause definitive conflict");
const verified: Venue = { ...base, technical: { maximumConstructionHeight: { value: 6.5, status: "verified" } } };
assert.equal(checkStand(verified,input).status,"conflict","verified height exceedance should flag conflict");
assert.throws(()=>checkStand(base,{...input,widthM:0}),/Dimensions/);
assert.equal(checkStand(base,{...input,doubleDeck:true}).status,"needs-review","double-deck always requires review");
console.log("✓ 101 venues and stand-check safety smoke tests passed");
