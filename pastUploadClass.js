//
//  pasteUpload
//  for Chrome
//  Created by jueduilingdu on 2018/9/19.
//  Copyright © 2018年 he. All rights reserved.
//
class pasteUploadClass {
    constructor({ filedata, api, timeOut}) {
        this.pasteImg = "";
        this.blob = "";
        this.uploadData = filedata || {};
        this.uploadApi = api || '';
        this.timeOut = timeOut;
    }
    pasteUpload(event) {
        // console.log(event);
        this.pasteImg = "";
        return new Promise((resolve, reject) => {
            if (event.clipboardData || event.originalEvent) {
                //某些chrome版本使用的是event.originalEvent
                let clipboardData = (event.clipboardData || event.originalEvent.clipboardData);
                if (clipboardData.items) {
                    let items = clipboardData.items,
                        len = items.length;
                    this.blob = null;
                    for (let i = 0; i < len; i++) {
                        if (items[i].type.indexOf("image") !== -1) {
                            this.blob = items[i].getAsFile();
                        }
                    }
                    if (this.blob !== null) {
                        let blobUrl = URL.createObjectURL(this.blob);
                        this.pasteImg = blobUrl;
                        resolve(this.pasteImgSend());
                    }
                }
            }
        });
    }
    pasteImgSend() {
        // console.log(this.blob)
        var fd = new FormData();
        fd.append("file", this.blob);
        for (const key in this.uploadData) {
            if (this.uploadData.hasOwnProperty(key)) {
                fd.append([key],this.uploadData[key]);
            }
        }
        //创建XMLHttpRequest对象
        var xhr = new XMLHttpRequest();
        xhr.open('POST', this.uploadApi);
        return new Promise((resolve, reject) => {
            xhr.onload = function () {
                if (xhr.readyState === 4) {
                    resolve(xhr);
                }
            };
            xhr.onerror = function (e) {
                console.log(e);
                resolve(xhr);
            };
            xhr.send(fd);
        });
    }
};
export {
    pasteUploadClass
}
