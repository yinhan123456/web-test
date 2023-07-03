import * as THREE from "three";

const RISEN_HEIGHT = 1;

export function getRoadDirection(center, roadInfo, scene) {
  const { points, roads } = roadInfo;
  const lines = [];
  for (let i = 0; i < roads.length; i++) {
    const p1 = new THREE.Vector3(
      points[roads[i][0] * 3],
      points[roads[i][0] * 3 + 1] + RISEN_HEIGHT, // 提升1m
      points[roads[i][0] * 3 + 2]
    );
    const p2 = new THREE.Vector3(
      points[roads[i][1] * 3],
      points[roads[i][1] * 3 + 1] + RISEN_HEIGHT, // 提升1m
      points[roads[i][1] * 3 + 2]
    );
    lines.push(new THREE.Line3(p1, p2));
  }

  let parking;
  scene.traverse((obj) => {
    if (obj.name === "parking") parking = obj;
  });
  const rc = new THREE.Raycaster();
  const risenCenter = center.clone();
  risenCenter.y += RISEN_HEIGHT;
  let minDistance = Number.POSITIVE_INFINITY;
  let minDistanceWithBlocking = Number.POSITIVE_INFINITY;
  let roadIndex;
  let roadIndexWidthBlocking;
  let roadDirection;
  let roadDirectionWithBlocking;
  lines.forEach((line, index) => {
    const closestPoint = line.closestPointToPoint(risenCenter, true, new THREE.Vector3());

    // 设置射线
    const direction = closestPoint.clone().sub(risenCenter).normalize();
    rc.set(risenCenter, direction);

    // 最近点到车位中心距离
    const distance = closestPoint.distanceTo(risenCenter);
    if (distance < minDistance) {
      roadIndex = index;
      minDistance = distance;
      roadDirection = direction.clone();
    }

    // 添加检测球
    const sphereGmt = new THREE.SphereGeometry(1.5);
    const mtl3 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(sphereGmt, mtl3);
    sphere.position.copy(closestPoint);
    scene.add(sphere);
    scene.updateMatrixWorld(true);

    const obj = rc.intersectObjects([sphere, parking], true);
    if ((obj[0] && obj[0].object) === sphere) {
      if (obj[0].distance < minDistanceWithBlocking) {
        roadIndexWidthBlocking = index;
        minDistanceWithBlocking = obj[0].distance;
        roadDirectionWithBlocking = direction.clone();
      }
      sphere.material.color = new THREE.Color(0x00ff00);
    }

    // 删除检测球
    scene.remove(sphere);
  });

  return { direction: roadDirection, roadIndex, roadIndexWidthBlocking };
}
