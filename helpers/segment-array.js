const blockArray = (arr, maxLength) => {
    let segmented = []
    for (let counter = 0; counter * maxLength < arr.length; counter++){
      if(maxLength > arr.length){
        segmented.push(arr.slice(counter * maxLength, arr.length))
      } 
      else {
        segmented.push(arr.slice(counter * maxLength, (counter + 1) * maxLength))
      }
    }
    
    return segmented
}

module.exports = blockArray;