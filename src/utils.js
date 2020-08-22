import {
  SIDE_T,
  SIDE_R,
  SIDE_B,
  SIDE_L,
  KEY_PLATFORM_TYPE,
  FRAME_DURAITON,
  KEY_OBJECT_FRAME,
  KEY_OBJECT_INITIAL_POS,
  KEY_OBJECT_ON_COLLIDED
} from './constants';
import { handleCollision } from './modules/enemies';

export const approach = (value, target, step) => {
  step = Math.abs(step);
  const diff = Math.abs(value - target);
  const sign = (value - target) / (diff || 1);
  return diff > step ? value - step * sign : target;
};
export const radiansToDegrees = (radians) => (radians * 180) / Math.PI;
export const vector = (x, y) => ({ x, y });
export const vectorAngle = (vectorA, vectorB) =>
  Math.atan2(vectorB.y - vectorA.y, vectorB.x - vectorA.x);
export const vectorStringify = (vector) =>
  `${vector.x.toFixed(3)},${vector.y.toFixed(3)}`;
export const vectorOp = (callback, vectors, output = {}) => {
  output.x = callback(...vectors.map(({ x }) => x));
  output.y = callback(...vectors.map(({ y }) => y));
  return output;
};
export const vectorDistance = (vectorA, vectorB) =>
  Math.hypot(vectorA.x - vectorB.x, vectorA.y - vectorB.y);
export const vectorMagnitude = (vectorA) =>
  vectorDistance(vectorA, vector(0, 0));

export const object = (x, y, w, h) => ({
  p: vector(x, y),
  s: vector(w, h),
  v: vector(0, 0),
  [KEY_OBJECT_FRAME]: 0,
  [KEY_OBJECT_INITIAL_POS]: vector(x, y)
});
export const getObjectBoundary = ({ p, s }) => ({
  [SIDE_L]: p.x - s.x / 2,
  [SIDE_T]: p.y + s.y / 2,
  [SIDE_R]: p.x + s.x / 2,
  [SIDE_B]: p.y - s.y / 2,
});

const isOverlap = (objectA, objectB, timeRatio) => {
  const boundaryA = getObjectBoundary(objectA);
  const boundaryB = getObjectBoundary(objectB);
  return (
    boundaryA.l + objectA.v.x * timeRatio <
      boundaryB.r + objectB.v.x * timeRatio &&
    boundaryA.r + objectA.v.x * timeRatio >
      boundaryB.l + objectB.v.x * timeRatio &&
    boundaryA.t + objectA.v.y * timeRatio >
      boundaryB.b + objectB.v.y * timeRatio &&
    boundaryA.b + objectA.v.y * timeRatio <
      boundaryB.t + objectB.v.y * timeRatio
  );
};

const SIDES = [
  [SIDE_L, SIDE_T, SIDE_R, SIDE_T],
  [SIDE_R, SIDE_T, SIDE_R, SIDE_B],
  [SIDE_R, SIDE_B, SIDE_L, SIDE_B],
  [SIDE_L, SIDE_B, SIDE_L, SIDE_T],
];
const isGoingThrough = (objectA, objectB, timeRatio) => {
  const nextAPos = vectorOp((pos, v) => pos + v * timeRatio, [
    objectA.p,
    objectA.v,
  ]);
  const boundaryB = getObjectBoundary(objectB);
  for (let [x1, y1, x2, y2] of SIDES) {
    const isIntersected = intersection(
      objectA.p,
      nextAPos,
      vector(boundaryB[x1], boundaryB[y1]),
      vector(boundaryB[x2], boundaryB[y2])
    );
    if (isIntersected) return true;
  }
  return false;
};

// ?? thin wall can be penetrated
export const collision = (objectA, objectB, timeRatio) => {
  if (isOverlap(objectA, objectB, timeRatio))
    return getClosetSide(objectA, objectB);
  if (isGoingThrough(objectA, objectB, timeRatio))
    return getClosetSide(objectA, objectB);
};

export const getClosetSide = (objectA, objectB) => {
  const angle = radiansToDegrees(vectorAngle(objectB.p, objectA.p));
  const boundaryB = getObjectBoundary(objectB);
  const ltAngle = radiansToDegrees(
    vectorAngle(objectB.p, vector(boundaryB.l, boundaryB.t))
  );
  const rtAngle = 180 - ltAngle;
  if (angle > rtAngle && angle < ltAngle) return SIDE_T;
  if (angle > ltAngle || angle < -ltAngle) return SIDE_L;
  if (angle < -rtAngle && angle > -ltAngle) return SIDE_B;
  if (angle > -rtAngle || angle < -rtAngle) return SIDE_R;
};

export const intersection = (a, b, c, d) => {
  const uA =
    ((d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x)) /
    ((d.y - c.y) * (b.x - a.x) - (d.x - c.x) * (b.y - a.y));
  const uB =
    ((b.x - a.x) * (a.y - c.y) - (b.y - a.y) * (a.x - c.x)) /
    ((d.y - c.y) * (b.x - a.x) - (d.x - c.x) * (b.y - a.y));

  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    return vector(a.x + uA * (b.x - a.x), a.y + uA * (b.y - a.y));
  }
};

export const platform = (type, x, y, w, h, options) => ({
  ...object(x, y, w, h),
  [KEY_PLATFORM_TYPE]: type,
  ...options
});

export const enemy = (x, y, w, h, options) => ({
  ...object(x, y, w, h),
  ...options,
  [KEY_OBJECT_ON_COLLIDED]: handleCollision
});

export const isEventOnTime = (frame, interval) =>
  Math.round(frame) > 0 && Math.round(frame) % Math.round(interval / FRAME_DURAITON) === 0;

export const getEventRatio = (frame, duration) => 
  frame % Math.round(duration / FRAME_DURAITON) / Math.round(duration / FRAME_DURAITON);
  
export const alternateProgress = process => Math.abs(process - 0.5) * 2;

export const objectEvent = (interval, callback) => object => 
  callback(object, getEventRatio(
    object[KEY_OBJECT_FRAME],
    interval
  ));

// export const addWindowEventListenr = (...args) => window.addEventListener(...args);
// export const beginPath = (ctx, ...args) => ctx.beginPath(...args);
// export const moveTo = (ctx, ...args) => ctx.moveTo(...args);
// export const lineTo = (ctx, ...args) => ctx.lineTo(...args);
// export const stroke = (ctx, ...args) => ctx.stroke(...args);
// export const fill = (ctx, ...args) => ctx.fill(...args);
// export const fillText = (ctx, ...args) => ctx.fillText(...args);
// export const fillRect = (ctx, ...args) => ctx.fillRect(...args);
