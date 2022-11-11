import axios from "axios"

export function detectGrid(url: string, imageData: any, imageType: string, onFinish: (result: any) => void) {
  console.log('uploading to: ', url + '/grid')
  axios.put(url + '/grid',
    imageData,
    {
        headers: {
            'Content-Type': imageType
        }
    }
  ).then(function (data) {
    onFinish(data.data)
  })
}

export function uploadPicture(url: string, imageData: any, x: string, y: string, grid_size: string, imageType: string, onFinish: (result: any) => void) {
  console.log('uploading to: ', url + '/tiles')
  axios.put(url + `/tiles?x=${x}&y=${y}&grid_size=${grid_size}`,
    imageData,
    {
        headers: {
            'Content-Type': imageType
        }
    }
  ).then(function (data) {
    onFinish(data.data)
  })
}