import * as SC from 'suncalc'
import { Matrix4, Quaternion, Vector3 } from 'three'

const SunCalc = SC.default ?? SC // works with either export style

const rad = (d) => (d * Math.PI) / 180
const Z = new Vector3(0, 0, 1)

export const MOON_DIST = 2.6 // Moon distance in Earth-local units

// suncalc 2.x gives DEGREES, with azimuth clockwise from NORTH (0 = N, 90 = E, 180 = S).
// Convert to radians, then to east / north / up parts of a unit direction.
const body = (p) => ({ az: rad(p.azimuth), alt: rad(p.altitude) })
const enu = (az, alt) => ({
  e: Math.sin(az) * Math.cos(alt),
  n: Math.cos(az) * Math.cos(alt),
  u: Math.sin(alt),
})

// Keep bodies that are above the horizon visible: squeeze 0-90° into about 2-14°.
const drawAlt = (alt) => (alt > 0 ? rad(2 + ((alt * 180) / Math.PI) * 0.13) : alt)

export function computeSky(latDeg, lonDeg, date = new Date()) {
  const phi = rad(latDeg)
  const lam = rad(lonDeg)

  // The city's up / east / north directions on the globe (Earth-fixed axes)
  const up = new Vector3(Math.cos(phi) * Math.cos(lam), Math.sin(phi), -Math.cos(phi) * Math.sin(lam))
  const east = new Vector3(-Math.sin(lam), 0, -Math.cos(lam))
  const north = new Vector3(-Math.sin(phi) * Math.cos(lam), Math.cos(phi), Math.sin(phi) * Math.sin(lam))

  const sun = body(SunCalc.getPosition(date, latDeg, lonDeg))
  const moon = body(SunCalc.getMoonPosition(date, latDeg, lonDeg))

  // Face the camera toward whichever body is up (Sun first), so it is in view.
  // Turning the globe by the body's compass bearing puts that bearing on world +Y.
  const focus = sun.alt > 0 || moon.alt <= 0 ? sun : moon
  const psi = focus.az

  // Earth orientation: city up -> +Z, east -> +X, north -> +Y, then turned by psi
  const basis = new Matrix4().makeBasis(east, north, up)
  const qInv = new Quaternion().setFromRotationMatrix(basis).invert()
  const qz = new Quaternion().setFromAxisAngle(Z, psi)
  const q = qz.clone().multiply(qInv)

  const toWorld = ({ e, n, u }) => new Vector3(e, n, u).applyQuaternion(qz)
  const toEarthLocal = ({ e, n, u }) =>
    new Vector3().addScaledVector(east, e).addScaledVector(north, n).addScaledVector(up, u)

  return {
    q,
    psi,
    lightDir: toWorld(enu(sun.az, sun.alt)).normalize(), // real sunlight direction
    sunDraw: toWorld(enu(sun.az, drawAlt(sun.alt))).normalize(),
    moonLocal: toEarthLocal(enu(moon.az, drawAlt(moon.alt))).multiplyScalar(MOON_DIST),
  }
}