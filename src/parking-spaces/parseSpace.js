import * as THREE from "three";
import { getRoadDirection } from "./getRoadDirection.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { around, similar } from "./utils.js";

function simplifyNumber(num) {
  return num.toFixed(4);
}

    // 负一层部分车位数据单独处理
    const directionWrongSpace =  ["224",   "246",  "241",  "240", 	"161",	"156", "157", "089", "091", "057", "012", "015", "027",
    ]

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
    const { direction: roadDirection, roadIndex, roadIndexWidthBlocking } = getRoadDirection(center, roadInfo, scene);


    // 车位方向应该与道路方向夹角小于90
    if (direction.angleTo(roadDirection) > Math.PI / 2) {
      direction.multiplyScalar(-1);
    }

    // 箭头
    const arrowHelper = new THREE.ArrowHelper(direction, center.clone().add(new THREE.Vector3(0, 0.1, 0)), 5, 0xfff000);
    scene.add(arrowHelper);

    // 计算于-z的角度
    let angle = direction.angleTo(directionNZ);
    angle = parseFloat(simplifyNumber(direction.x > 0 ? -angle : angle));

    const result = {
      center: center.toArray().map(n => around(n)),
      width: around(width),
      height: around(height),
    }


    if (roadIndex !== roadIndexWidthBlocking) {
      result.roadIndex = roadIndexWidthBlocking
      console.error(spaceMesh.name + "路径不匹配")
    }

    // 负一层部分车位数据单独处理
    const directionWrongSpace = ["224","246","241","240", "161","156","157","089","091","057","012","015","027"]
    if (directionWrongSpace.includes(spaceMesh.name)) {
      if (similar(angle, Math.PI)) {
        angle -= Math.PI
      } else {
        angle += Math.PI
      }
      console.log("角度补丁", spaceMesh.name, angle)
    }

    angle = around(angle)
    if (!similar(angle, 0)) {
      result.angle = angle
    }

    return result;
  } else {
    console.error(spaceMesh.name + "的positionCache元素数量不为4");
    console.error("positionCache: ", positionCache);
  }
}


