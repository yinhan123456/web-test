import * as THREE from "three";
import { getRoadDirection } from "./getRoadDirection.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

function simplifyNumber(num) {
  return num.toFixed(4);
}

export function parseSpace(spaceMesh, roadInfo, scene) {
  // 合并mesh
  const geometries = [];
  spaceMesh.traverse((obj) => {
    if (obj.isMesh) {
      obj.updateWorldMatrix(true, false);
      const g = obj.geometry.clone();
      g.applyMatrix4(obj.matrixWorld);
      geometries.push(g);
    }
  });
  const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
  mergedGeometry.computeBoundingSphere();
  const center = mergedGeometry.boundingSphere.center;
  const radius = mergedGeometry.boundingSphere.radius;

  // const sphereGmt = new THREE.SphereGeometry(radius);
  // const mtl3 = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
  // const sphere = new THREE.Mesh(sphereGmt, mtl3);
  // sphere.position.copy(center);
  // scene.add(sphere);

  // 获取所有顶点
  const positions = mergedGeometry.getAttribute("position");

  // 获取矩形四个顶点
  const v3 = new THREE.Vector3();
  const positionCache = [];
  for (let i = 0; i < positions.count; i++) {
    // 遍历所有顶点
    v3.set(positions.getX(i), positions.getY(i), positions.getZ(i));

    // 计算顶点到中心距离, 记录距边界球小于1cm的顶点
    const toCenterDistance = v3.clone().sub(center).length();
    if (Math.abs(toCenterDistance - radius) < 0.01) {
      if (positionCache.every((p) => !p.equals(v3))) {
        positionCache.push(v3.clone());
      }
    }
  }

  // 计算方向、宽高
  const size = [];
  const directionNZ = new THREE.Vector3(0, 0, -1);
  if (positionCache.length === 4) {
    // 遍历完一个车位的所有顶点后，positionCache中应该包含四个顶点，计算顶点之间的距离，获取宽高
    for (let i = 1; i < 4; i++) {
      size.push({
        length: positionCache[0].clone().sub(positionCache[i]).length(),
        index: i,
      });
    }
    size.sort((a, b) => a.length - b.length);
    const width = size[0].length;
    const height = size[1].length;

    // 获取车位方向（(0, 0, -1)时angle为0）
    // 车位方向
    const direction = positionCache[size[1].index].clone().sub(positionCache[0]).normalize();
    // 道路方向
    const { direction: roadDirection } = getRoadDirection(center, roadInfo, scene);
    // 车位方向应该于道路方向夹角小于90
    if (direction.angleTo(roadDirection) > Math.PI / 2) {
      direction.multiplyScalar(-1);
    }

    // 箭头
    const arrowHelper = new THREE.ArrowHelper(direction, center, 5, 0xfff000);
    scene.add(arrowHelper);

    // 计算于-z的角度
    let angle = direction.angleTo(directionNZ);
    angle = simplifyNumber(direction.x > 0 ? -angle : angle);

    return {
      position: center.toArray().map(n => around(n)),
      width: around(width),
      height: around(height),
      angle: around(parseFloat(angle)),
    };
  } else {
    console.error(spaceMesh.name + "的positionCache元素数量不为4");
    console.error("positionCache: ", positionCache);
  }
}


// 精确到小数点后3位
export function around(num) {
  return Math.round(num * 1000) / 1000;
}