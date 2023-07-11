import * as THREE from "three";
import { getRoadDirection } from "./getRoadDirection.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function parseRoad(roadMesh, scene) {
  // 路口位置获取
  const crossingPosition = [];
  const roads = [];
  roadMesh.children.forEach((obj) => {
    obj.updateWorldMatrix(true, false);
    obj.geometry.computeBoundingSphere();
    const p = obj.geometry.boundingSphere.center.clone();
    p.applyMatrix4(obj.matrixWorld);

    const [index, neighborStr] = obj.name.split("-");
    const neighbors = neighborStr.split(",");
    // console.log(index, neighbors);

    crossingPosition[index - 1] = p;

    neighbors.forEach((j) => {
      const road = [index - 1, j - 1].sort((a, b) => a - b);
      if (roads.every(([a, b]) => !(a === road[0] && b === road[1]))) {
        roads.push(road);
      }
    });
  });

  roads.forEach((road) => {
    const material = new THREE.LineBasicMaterial({
      color: 0xff0000,
    });

    const points = [];
    points.push(crossingPosition[road[0]].clone());
    points.push(crossingPosition[road[1]].clone());

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
  });

  const points = []
  crossingPosition.forEach((p) => {
    const sphereGmt = new THREE.SphereGeometry(1);
    const mtl3 = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const sphere = new THREE.Mesh(sphereGmt, mtl3);
    sphere.position.copy(p);
    scene.add(sphere);

    points.push(...p.toArray())
  });

  console.log("roads: ", roads);
  return {
    points,
    roads
  }
}
