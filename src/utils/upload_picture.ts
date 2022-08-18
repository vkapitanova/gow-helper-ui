import axios from "axios"

export function uploadPicture(url: string, imageData: any, imageType: string, onFinish: (result: any) => void) {
  console.log('uploading to: ', url)
  axios.put(url + '/upload',
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