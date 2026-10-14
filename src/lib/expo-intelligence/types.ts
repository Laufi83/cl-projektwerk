export type VerificationStatus = "verified" | "unverified" | "outdated";
export type ExpoSource = { url: string; title: string; checkedAt?: string };
export type VerifiedValue<T> = { value: T | null; unit?: string; status: VerificationStatus; scope?: string; source?: ExpoSource };
export type Venue = {
 id: string; name: string; city: string; country: string; continent: string;
 coordinates?: { lat: number; lng: number };
 officialWebsite?: string;
 technical: {
  minimumWallHeight?: VerifiedValue<number>;
  maximumConstructionHeight?: VerifiedValue<number>;
  riggingLoad?: VerifiedValue<number>;
  doubleDeckAllowed?: VerifiedValue<boolean>;
  sprinklerRequirement?: VerifiedValue<string>;
 };
 sources: ExpoSource[];
};
export type StandCheckInput = { venueId: string; widthM: number; depthM: number; heightM: number; doubleDeck: boolean };
export type StandCheckFinding = { severity: "conflict" | "needs-review" | "information"; message: string; source?: ExpoSource };
export type StandCheckResult = { status: "conflict" | "needs-review"; findings: StandCheckFinding[] };
