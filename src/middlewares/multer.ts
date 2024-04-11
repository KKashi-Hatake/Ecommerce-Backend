import multer from "multer";
import {v4 as uuid} from 'uuid';






const storage = multer.diskStorage({
  destination:function(req, file, callback) {
    callback(null, "upload");
  },
  filename:function(req, file, callback) {
    const id =uuid();
    const extname = file.originalname.split(".").pop();
    const fileName = `${id}.${extname}`
    callback(null, fileName);
  },
});

export const singleUpload = multer({ storage }).single("photo");
