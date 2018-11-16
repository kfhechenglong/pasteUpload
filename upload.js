
//  pasteUpload
//  for Chrome
//  Created by jueduilingdu on 2018/9/19.
//  Copyright © 2018年 he. All rights reserved.
//
class pasteUploadClass {
    constructor({ filedata, api, blob, timeOut }, callbackprogress,callbackloadstart) {
        this.pasteImg = "";
        this.blob = blob || "";
        this.uploadData = filedata || {};
        this.uploadApi = api || '';
        this.timeOut = timeOut;
        this.setSize = 1;//定义文件上传的最小限制
        this.callbackprogress = callbackprogress;
        this.callbackloadstart = callbackloadstart;
    }
    // 静态方法
    // 将base64转换成文件格式
    static dataURLtoFile(dataurl, filename = 'file') {
        let arr = dataurl.split(',')
        let mime = arr[0].match(/:(.*?);/)[1]
        let suffix = mime.split('/')[1]
        let bstr = atob(arr[1])
        let n = bstr.length
        let u8arr = new Uint8Array(n)
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
        }
        return new File([u8arr], `${filename}.${suffix}`, { type: mime })
    }
    pasteUpload(event) {
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
    // 文件压缩
    photoCompress(file, options) {
        var ready = new FileReader();
        ready.readAsDataURL(file);
        let that = this;
        return new Promise((resolve,reject) => {
            ready.onload = function () {
                var re = this.result;
                resolve(that.canvasDataURL(re, options))
            }
        })
    }
    // 转canvas压缩
    canvasDataURL(path, options) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.src = path;
            img.onload = function () {
                // 默认按比例压缩
                let w = this.width,
                    h = this.height,
                    scale = w / h;
                    w = w > 1024 ? 1024 : w;
                w = options.width || w;
                h = options.height || (w / scale);
                let quality = 1;  // 默认图片质量为0.7
                //生成canvas
                let canvas = document.createElement('canvas');
                let ctx = canvas.getContext('2d');
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(this, 0, 0, w, h);
                // 图像质量
                if (options.quality && options.quality <= 1 && options.quality > 0) {
                    quality = options.quality;
                }
                // quality值越小，所绘制出的图像越模糊
                let base64 = canvas.toDataURL('image/jpeg', quality);
                // 回调函数返回base64的值
                resolve(base64);
            }
            img.onerror = function(){
                reject('图片压缩错误!')
            }
        })
    }
    // 文件大小检查
    async checkSize(file, options){
        // 检查文件大小
        if (file.size / 1024 > 1025 * this.setSize) {//压缩后上传
            let base64 = await this.photoCompress(file,options);
            let img = pasteUploadClass.dataURLtoFile(base64);
            return img;
        } else {
            // 直接上传
            return file;
        }
    }
    // 接收上传的文件
    async pasteImgSend(blob = this.blob, options = {}) {
        // console.log(blob);
        // 判断传入的文件是否为数组，支持多文件上传
        if (Array.isArray(blob)){
            // blob.forEach(file => {
            //     this.upLoadFiles(this.checkSize(file));
            // })
        } else {
            let file = await this.checkSize(blob, options);
            return await this.upLoadFiles(file);
        }
    }
    // 上传文件
    upLoadFiles(file){
        // console.log(file);
        let that = this;
        let ot = 0;   //设置上传开始时间
        let oloaded = 0;//设置上传开始时，以上传的文件大小为0
        let fd = new FormData();
        fd.append("file", file);
        for (const key in this.uploadData) {
            if (this.uploadData.hasOwnProperty(key)) {
                fd.append([key],this.uploadData[key]);
            }
        }
        //创建XMLHttpRequest对象
        let xhr = new XMLHttpRequest();
        xhr.open('POST', this.uploadApi);
        return new Promise((resolve, reject) => {
            xhr.onload = function () {
                if (xhr.readyState === 4) {
                    // resolve(xhr);
                    if (xhr.status === 200 && xhr.statusText) {
                        resolve(JSON.parse(xhr.response));
                    } else {
                        reject({ code: xhr.status, msg: xhr.statusText});
                    }
                }
            };
            xhr.onerror = function (e) {
                reject(xhr);
            };
            xhr.upload.onprogress = function (evt){
                const total = evt.total;
                const loaded = evt.loaded;
                let progress = Math.round(loaded / total * 100);
                let nt = new Date().getTime();//获取当前时间
                let pertime = (nt - ot) / 1000; //计算出上次调用该方法时到现在的时间差，单位为s
                ot = new Date().getTime(); //重新赋值时间，用于下次计算
                let perload = loaded - oloaded; //计算该分段上传的文件大小，单位b
                oloaded = loaded;//重新赋值已上传文件大小，用以下次计算
                //上传速度计算
                let speed = perload / pertime;//单位b/s
                let bspeed = speed;
                let units = 'b/s';//单位名称
                if (speed / 1024 > 1) {
                    speed = speed / 1024;
                    units = 'k/s';
                }
                if (speed / 1024 > 1) {
                    speed = speed / 1024;
                    units = 'M/s';
                }
                speed = speed.toFixed(1);
                //剩余时间
                let resttime = ((total - loaded) / bspeed).toFixed(1);
                console.log('总大小' + total + '，已上传' + loaded + '，当前进度' + progress +' %，速度：' + speed + units + '，剩余时间：' + resttime + 's');
                // 上传进度的回调函数
                that.callbackprogress ? that.callbackprogress({ total, loaded, progress, speed, units, resttime}) : '';
            }
            xhr.upload.onloadstart = function () {//上传开始执行方法
                ot = new Date().getTime();   //设置上传开始时间
                oloaded = 0;//设置上传开始时，以上传的文件大小为0
                // 上传开始的回调函数
                that.callbackloadstart ? that.callbackloadstart() : '';
            };
            xhr.send(fd);
        });
    }
};
export {
    pasteUploadClass
}

