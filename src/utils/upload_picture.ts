import axios from "axios"

export function uploadPicture(imageData: any, imageType: string, onFinish: (result: any) => void) {
  axios.put('http://localhost:5000/upload',
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