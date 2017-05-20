//Fail safe
process.on('uncaughtException', function (err) {
    console.error('uncaughtException',err);
});
//variables
var https = require('https');
var express = require('express');
var fs = require('fs');
var app = express()
var config = require('./conf.json')
var cameraBrands=null;
if(!config.port){config.port=80}
s={cachedCameras:{}};
s.dir={
    web:__dirname+'/web',
    web_pages:__dirname+'/web/pages/',
    doc_pages:__dirname+'/web/docs/'
}
s.getCameraData=function(x,success,fail){
    var target;
    if(x!=='brands'){
        var target='cameras/'+x
    }else{
        var target='brands';
    }
    var href='https://raw.githubusercontent.com/ShinobiCCTV/cameraConnectionList/master/'+decodeURIComponent(target)+'.json';
    if(!s.cachedCameras[x]){
        https.request(href, function(data) {
            data.setEncoding('utf8');
            var chunks='';
            data.on('data', (chunk) => {
              chunks+=chunk;
            });
            data.on('end', () => {
              s.cachedCameras[x]=chunks;
              success(chunks)
            });
        }).on('error',fail).end();
    }else{
        success(s.cachedCameras[x])
    }
    
    return href;
}
s.getBrands=function(){
    s.getCameraData('brands',function(data){
    },function(er){
        if(er){
           s.getBrands()
        }
    })
}
s.getBrands()
app.use('/', express.static(process.cwd() + '/web'));
app.set('views', __dirname + '/web');
app.set('view engine', 'ejs');
///donations
app.get('/donations.json', function(req, res) {
    req.orders=[];
    req.run=function(x){
        https.request('https://cloudchat.online/admin/api.php?api_id='+config.hostbill.id+'&api_key='+config.hostbill.key+'&call=getOrders&list=active', function(data) {
              data.setEncoding('utf8');
              req.chunks='';
              data.on('data', (chunk) => {
                  req.chunks+=chunk;
              });
              data.on('end', () => {
                try{req.chunks=JSON.parse(req.chunks);}catch(er){}
                req.orders=req.orders.concat(req.chunks.orders)
                if(req.chunks.sorter.totalpages>=req.chunks.sorter.sorterpage){
                    res.send(JSON.stringify(req.orders))
    //                res.end();
                }else{
                    req.run(req.chunks.sorter.sorterpage+1)
                }
              });

        }).on('error', function(e) {
            res.sendStatus(500);
        }).end();
    }
    req.run(1)
})
app.get('/data/cameras/:file', function(req, res) {
    res.set({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    })
    s.getCameraData(req.params.file,function(data){
        res.end(data)
    },function(){
        res.sendStatus(500);
    })
});
app.get('/data/:file', function(req, res) {
    req.file='data/'+req.params.file;
    fs.exists(req.file,function(exists){
        if(exists){
            fs.createReadStream(req.file).pipe(res).end()
        }else{
            res.send(JSON.stringify({ok:false,msg:'no file found'}));
            res.end();
        }
    })
    
});
app.get(['/docs/cameras','/docs/cameras/:file'], function(req, res) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    s.getCameraData(req.params.file,function(data){
        res.render('docs/cameras',{config:config,pageData:data,currentBrand:req.params.file,cameraBrands:s.cachedCameras.brands});
    },function(){
        res.sendStatus(500);
    })
})
app.get(['/docs','/docs/:file'], function(req, res) {
    req.pageDataFile='web/data/'+req.params.file+'.json';
    if(req.params.file&&fs.existsSync(req.pageDataFile)){
       try{req.pageData=JSON.parse(fs.readFileSync(req.pageDataFile,'utf8'));}catch(err){console.log(err)}
    }
    if(req.params.file){
        req.file=req.params.file
    }else{
        req.file='index';
    }
    res.render('docs/'+req.file,{config:config,pageData:req.pageData});
});
app.get(['/','/:file'], function(req, res) {
    req.pageDataFile='web/data/'+req.params.file+'.json';
    if(req.params.file&&fs.existsSync(req.pageDataFile)){
       try{req.pageData=JSON.parse(fs.readFileSync(req.pageDataFile,'utf8'));}catch(err){console.log(err)}
    }
    if(req.params.file&&req.params.file!=='cameras'){
        req.file=req.params.file
    }else{
        req.file='index';
    }
    res.render('pages/'+req.file,{config:config,pageData:req.pageData});
});
//start server
app.listen(config.port,config.ip,function () {
  console.log('Website Loaded on port '+config.port)
});
exec('pm2 flush')
setTimeout(function(){
    exec('pm2 flush')
},60000*60*2)