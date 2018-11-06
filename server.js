request = require('request'),
    https = require('https')
querystring = require('querystring');
var crypto = require('crypto');


const express=require('express');
const bodyParser=require('body-parser');

const pathLib=require('path');
const fs=require('fs');

const multer=require('multer');
const multerObj=multer({dest:'./images'});


function objKeySort(arys) {
    //先用Object内置类的keys方法获取要排序对象的属性名，再利用Array原型上的sort方法对获取的属性名进行排序，newkey是一个数组
    var newkey = Object.keys(arys).sort();
    var newObj = {}; //创建一个新的对象，用于存放排好序的键值对
    for(var i = 0; i < newkey.length; i++) {
        //遍历newkey数组
        newObj[newkey[i]] = encodeURIComponent(arys[newkey[i]]);
        //向新创建的对象中按照排好的顺序依次增加键值对
        //console.info(encodeURIComponent(arys[newkey[i]]));
    }
    return newObj; //返回排好序的新对象

}
function MD5(body) {
    let md5 = crypto.createHash('md5');
    md5.update(body);
    return md5.digest('hex');
}


let AipContentCensorClient = require('baidu-aip-sdk').contentCensor;


// 设置APPID/AK/SK
let APP_ID = '11685556'
let API_KEY = 'ELS0CGtNxbq15Gs0GGyP8xx8'
let SECRET_KEY = 'U5U5LHnsaDcErfguBOBTlGjR107i5hku'

// 新建一个对象，建议只保存一个对象调用服务接口
let client = new AipContentCensorClient(APP_ID, API_KEY, SECRET_KEY);


let server=express();
server.listen(8889);




server.use(multerObj.any());

/**
 * 设定post，最大post最大限制为10mb，可以在此设定上传文件最大容量
 */
server.use(bodyParser.urlencoded({extended: false,limit:'10mb'}));



server.post('/pic', function(req, res){
    var ext=pathLib.parse(req.files[0].originalname).ext;
    var oldPath=req.files[0].path;
    var newPath=req.files[0].path+ext;
    var newFileName=req.files[0].filename+ext;
    fs.rename(oldPath,newPath,(err)=>{
        if(err){
            res.status(500).send('fail fs').end();
        }else {
            var bitmap = fs.readFileSync(newPath);
            var base64Img = new Buffer(bitmap).toString('base64');

            // 图片base64编码调用接口
            client.imageCensorUserDefined(base64Img, 'base64').then(function(data) {
                //res.json(data).end()
                console.log('<imageCensorUserDefined>: ' + JSON.stringify(data));


                let post = {
                    app_id:2107863903,
                    image:base64Img,
                    time_stamp: parseInt(Date.now() /1000),
                    nonce_str:parseInt(Date.now() /1000),
                };
                var str = querystring.stringify(objKeySort(post)) + '&app_key=E9T6ifcDPqmpDvor';
                post.sign = MD5(str).toUpperCase();
                post.image = encodeURIComponent(base64Img);
                var a  = querystring.stringify(post);
                //console.info(a)


                request.post('https://api.ai.qq.com/fcgi-bin/image/image_tag', {form: querystring.stringify(post)}, function(err, res, body){
                    console.log(body)
                })
                res.json('succ').end()
            }, function(e) {
                res.json('failpic').end()
            });
        }
    })
});