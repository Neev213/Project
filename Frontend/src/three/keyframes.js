// p = scroll progress (0..1)
// cam = camera position, earth = Earth position, scale = Earth size,
// rotY = Earth turn, vis = Sun and Moon visibility (0 hidden, 1 shown)
export const KEYFRAMES = [
    { p: 0,    cam: [0, 0, 9],   earth: [0, 4.3, 0],     scale: 3.0, rotY: 0.0, vis: 0 },
    { p: 0.25, cam: [0, 0, 2.6], earth: [0, 0, 0],       scale: 1.0, rotY: 1.2, vis: 0 },
    { p: 0.5,  cam: [0, 0, 9],   earth: [3.2, 0, 0],     scale: 1.4, rotY: 2.2, vis: 0 },
    { p: 0.75, cam: [0, 0, 9],   earth: [-2.6, -0.3, 0], scale: 2.2, rotY: 3.6, vis: 0 },
    { p: 1,    cam: [0, 0, 9],   earth: [0, 0, 0],       scale: 1.0, rotY: 4.2, vis: 1 },
]