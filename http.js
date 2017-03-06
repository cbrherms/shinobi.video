//Fail safe
process.on('uncaughtException', function (err) {
    console.error('uncaughtException',err);
});

//variables
var fs = require('fs');
var express = require('express')
var app = express()
s={};
s.dir={
    web:__dirname+'/web',
    web_pages:__dirname+'/web/pages/',
    doc_pages:__dirname+'/web/docs/'
}
app.use('/', express.static(process.cwd() + '/web'));
app.set('views', __dirname + '/web');
app.set('view engine', 'ejs');

    app.get(['/docs','/docs/:file'], function(req, res) {
        if(req.params.file){
            req.file=req.params.file
        }else{
            req.file='index';
        }
        res.render('docs/'+req.file);
    });
    app.get(['/','/:file'], function(req, res) {
        if(req.params.file){
            req.file=req.params.file
        }else{
            req.file='index';
        }
        res.render('pages/'+req.file);
    });
//start server
app.listen(81, function () {
  console.log('Website Loaded')
});