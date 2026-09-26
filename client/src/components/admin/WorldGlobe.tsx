import {
useEffect,
useRef,
} from "react";

import Globe from "three-globe";
import * as THREE from "three";
import gsap from "gsap";

import type {
VisitorLocation,
} from "../../types/analytics";

interface WorldGlobeProps {
locations?: VisitorLocation[];
className?: string;
}

interface GlobePoint {
lat: number;
lng: number;
size: number;
color: string;
country: string;
city: string;
visitors: number;
}

export default function WorldGlobe({
locations = [],
className = "",
}: WorldGlobeProps) {
const containerRef =
useRef<HTMLDivElement>(null);

useEffect(() => {
const container =
containerRef.current;

if (!container) {
  return;
}

const width =
  container.clientWidth;

const height =
  container.clientHeight;

if (
  width <= 0 ||
  height <= 0
) {
  return;
}

const scene =
  new THREE.Scene();

scene.background =
  new THREE.Color("#020617");

/*
 * three-globe uses a much larger
 * default globe radius than the
 * camera position used previously.
 *
 * Putting the camera around 300
 * units away gives us a properly
 * framed Earth.
 */
const camera =
  new THREE.PerspectiveCamera(
    45,
    width / height,
    0.1,
    1000,
  );

camera.position.set(
  0,
  0,
  300,
);

const renderer =
  new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2,
  ),
);

renderer.setSize(
  width,
  height,
);

renderer.outputColorSpace =
  THREE.SRGBColorSpace;

container.appendChild(
  renderer.domElement,
);

const globe =
  new Globe();

globe
  .globeImageUrl(
    "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
  )
  .bumpImageUrl(
    "https://unpkg.com/three-globe/example/img/earth-topology.png",
  )
  .showAtmosphere(true)
  .atmosphereColor(
    "#38bdf8",
  )
  .atmosphereAltitude(
    0.15,
  );

scene.add(globe);

const points: GlobePoint[] =
  locations.map(
    (location) => ({
      lat: location.latitude,
      lng: location.longitude,
      size: Math.min(
        0.5 +
          location.visitors *
            0.015,
        1.5,
      ),
      color: "#22c55e",
      country:
        location.country,
      city:
        location.city,
      visitors:
        location.visitors,
    }),
  );

globe
  .pointsData(points)
  .pointLat(
    (point) =>
      (point as GlobePoint).lat,
  )
  .pointLng(
    (point) =>
      (point as GlobePoint).lng,
  )
  .pointColor(
    (point) =>
      (point as GlobePoint).color,
  )
  .pointRadius(
    (point) =>
      (point as GlobePoint).size,
  )
  .pointAltitude(0.025);

const ambientLight =
  new THREE.AmbientLight(
    0xffffff,
    1.8,
  );

scene.add(
  ambientLight,
);

const directionalLight =
  new THREE.DirectionalLight(
    0xffffff,
    2,
  );

directionalLight.position.set(
  5,
  3,
  5,
);

scene.add(
  directionalLight,
);

/*
 * Start slightly smaller and
 * animate the globe into place.
 */
globe.scale.set(
  0.86,
  0.86,
  0.86,
);

gsap.to(
  globe.scale,
  {
    x: 1,
    y: 1,
    z: 1,
    duration: 1.2,
    ease: "power3.out",
  },
);

let isDragging =
  false;

let previousX = 0;
let previousY = 0;

let rotationVelocityX = 0;
let rotationVelocityY = 0;

const handlePointerDown = (
  event: PointerEvent,
) => {
  isDragging = true;

  previousX =
    event.clientX;

  previousY =
    event.clientY;

  container.setPointerCapture(
    event.pointerId,
  );
};

const handlePointerMove = (
  event: PointerEvent,
) => {
  if (!isDragging) {
    return;
  }

  const deltaX =
    event.clientX -
    previousX;

  const deltaY =
    event.clientY -
    previousY;

  previousX =
    event.clientX;

  previousY =
    event.clientY;

  rotationVelocityY =
    deltaX * 0.004;

  rotationVelocityX =
    deltaY * 0.004;

  globe.rotation.y +=
    rotationVelocityY;

  globe.rotation.x +=
    rotationVelocityX;

  globe.rotation.x =
    THREE.MathUtils.clamp(
      globe.rotation.x,
      -0.7,
      0.7,
    );
};

const handlePointerUp = (
  event: PointerEvent,
) => {
  isDragging = false;

  if (
    container.hasPointerCapture(
      event.pointerId,
    )
  ) {
    container.releasePointerCapture(
      event.pointerId,
    );
  }
};

const handlePointerLeave =
  () => {
    isDragging = false;
  };

container.addEventListener(
  "pointerdown",
  handlePointerDown,
);

container.addEventListener(
  "pointermove",
  handlePointerMove,
);

container.addEventListener(
  "pointerup",
  handlePointerUp,
);

container.addEventListener(
  "pointerleave",
  handlePointerLeave,
);

let animationFrame = 0;

const animate = () => {
  animationFrame =
    requestAnimationFrame(
      animate,
    );

  if (!isDragging) {
    globe.rotation.y +=
      0.00035;

    globe.rotation.y +=
      rotationVelocityY;

    globe.rotation.x +=
      rotationVelocityX;

    rotationVelocityY *=
      0.94;

    rotationVelocityX *=
      0.94;
  }

  renderer.render(
    scene,
    camera,
  );
};

animate();

const handleResize =
  () => {
    const newWidth =
      container.clientWidth;

    const newHeight =
      container.clientHeight;

    if (
      newWidth <= 0 ||
      newHeight <= 0
    ) {
      return;
    }

    camera.aspect =
      newWidth /
      newHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      newWidth,
      newHeight,
    );
  };

window.addEventListener(
  "resize",
  handleResize,
);

return () => {
  cancelAnimationFrame(
    animationFrame,
  );

  window.removeEventListener(
    "resize",
    handleResize,
  );

  container.removeEventListener(
    "pointerdown",
    handlePointerDown,
  );

  container.removeEventListener(
    "pointermove",
    handlePointerMove,
  );

  container.removeEventListener(
    "pointerup",
    handlePointerUp,
  );

  container.removeEventListener(
    "pointerleave",
    handlePointerLeave,
  );

  gsap.killTweensOf(
    globe.scale,
  );

  scene.remove(
    globe,
  );

  renderer.dispose();

  if (
    renderer.domElement.parentElement ===
    container
  ) {
    container.removeChild(
      renderer.domElement,
    );
  }
};

}, [locations]);

return (
<div
ref={containerRef}
className={`relative h-[520px] w-full overflow-hidden rounded-3xl ${className}`}
> <div className="pointer-events-none absolute left-6 top-6 z-10"> <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Live visitors </p>

    <p className="mt-1 text-xl font-semibold text-white">
      Global activity
    </p>
  </div>

  <div className="pointer-events-none absolute bottom-5 left-5 z-10 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-md">
    <p className="text-xs text-slate-300">
      Drag to rotate
    </p>

    <p className="mt-1 text-xs text-slate-500">
      Use your cursor to move the world
    </p>
  </div>

  <div className="pointer-events-none absolute bottom-5 right-5 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur-md">
    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

    <span className="text-xs text-slate-400">
      Live
    </span>
  </div>
</div>

);
}
