import * as SC from 'suncalc'
import { Matrix4, Quaternion, Vector3 } from 'three'

const SunCalc = SC.default ?? SC // works with either export style

const rad = (d) => (d * Math.PI) / 180
const Z = new Vector3(0, 0, 1)

export const MOON_DIST = 2.6 // Moon distance in Earth-local units

// suncalc: azimuth 0 = south, positive toward west. Returns east/north/up parts.
const enu = (az, alt) => ({
  e: -Math.sin(az) * Math.cos(alt),
  n: -Math.cos(az) * Math.cos(alt),
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

  const sun = SunCalc.getPosition(date, latDeg, lonDeg)
  const moon = SunCalc.getMoonPosition(date, latDeg, lonDeg)

  // Face the camera toward whichever body is up (Sun first), so it is in view
  const focus = sun.altitude > 0 || moon.altitude <= 0 ? sun : moon
  const psi = Math.PI / 2 - Math.atan2(-Math.cos(focus.azimuth), -Math.sin(focus.azimuth))

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
    lightDir: toWorld(enu(sun.azimuth, sun.altitude)).normalize(), // real sunlight direction
    sunDraw: toWorld(enu(sun.azimuth, drawAlt(sun.altitude))).normalize(),
    moonLocal: toEarthLocal(enu(moon.azimuth, drawAlt(moon.altitude))).multiplyScalar(MOON_DIST),
  }
}