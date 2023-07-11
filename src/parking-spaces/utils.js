// 精确到小数点后3位
export function around(num) {
  return Math.round(num * 1000) / 1000;
}


export function similar(n1, n2) {
  return Math.abs(n1 - n2) < 0.01
  // return n1.toFixed(2) === n2.toFixed(2)
  // return Math.fixe(n1 * 100) === Math.floor(n2 * 100)
}