import { describe, expect, it } from 'vitest';
import { HOME_COORDS, distanceFromHomeKm, haversineKm } from '../lib/geo';

describe('haversineKm', () => {
  it('is zero for identical points', () => {
    expect(haversineKm(HOME_COORDS, HOME_COORDS)).toBe(0);
  });

  it('Drummoyne to Sydney CBD (Town Hall) is roughly 6-7 km', () => {
    const townHall = { lat: -33.8732, lng: 151.2069 };
    const km = haversineKm(HOME_COORDS, townHall);
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(8);
  });

  it('is symmetric', () => {
    const a = { lat: -33.8, lng: 151.1 };
    const b = { lat: -33.9, lng: 151.2 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });
});

describe('distanceFromHomeKm', () => {
  it('rounds to one decimal', () => {
    const km = distanceFromHomeKm({ lat: -33.8732, lng: 151.2069 });
    expect(km).toBe(Math.round(km * 10) / 10);
  });
});
