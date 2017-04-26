//Fail safe
process.on('uncaughtException', function (err) {
    console.error('uncaughtException',err);
});
//variables
var fs = require('fs');
var express = require('express')
var request = require('request')
var app = express()
var config = require('./conf.json')
s={};
s.dir={
    web:__dirname+'/web',
    web_pages:__dirname+'/web/pages/',
    doc_pages:__dirname+'/web/docs/'
}
app.use('/', express.static(process.cwd() + '/web'));
app.set('views', __dirname + '/web');
app.set('view engine', 'ejs');
app.get('/donations.json', function(req, res) {
    req.orders=[];
    this.engine=function(){}
    req.run=function(x){
        request('http://cloudchat.online/admin/api.php?api_id='+config.hostbill.id+'&api_key='+config.hostbill.key+'&call=getOrders&list=active',function (error, response, data) {
            data=JSON.parse(data);
            req.orders=req.orders.concat(data.orders)
            if(data.sorter.totalpages>=data.sorter.sorterpage){
                res.send(JSON.stringify(req.orders))
//                res.end();
            }else{
                req.run(data.sorter.sorterpage+1)
            }
        });
    }
    req.run(1)
});
app.get(['/docs','/docs/:file'], function(req, res) {
    if(req.params.file){
        req.file=req.params.file
    }else{
        req.file='index';
    }
    res.render('docs/'+req.file,{config:config});
});

app.get(['/','/:file'], function(req, res) {
    if(req.params.file){
        req.file=req.params.file
    }else{
        req.file='index';
    }
    res.render('pages/'+req.file,{config:config});
});
//start server
app.listen(config.port,config.ip,function () {
  console.log('Website Loaded on port '+config.port)
});