function quickSort(arr, left, right) {

  if (right < left) return 

  let i = left;
  let j = right;
  while (i < j) {
    let refer = arr[j];

    while (i < j) {
      if (arr[i] > refer) {
        arr[j] = arr[i];
        arr[i] = refer;

        j--
        break;
      }

      i++;
    }

    refer = arr[i];

    while (i < j) {
      if (arr[j] < refer) {
        arr[i] = arr[j];
        arr[j] = refer;

        i++
        break;
      }

      j--;
    }

  }

  quickSort(arr, left, i-1)
  quickSort(arr, j+1, right)
}


const arr = [5,4,8,1,9,7,3,2,6,0]
quickSort(arr, 0, arr.length - 1)
console.log(arr)