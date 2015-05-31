var express    = require("express");
var mysql      = require('mysql');
var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'ywang2',
        password : '',
        database : 'test'
    });
var app = express();

//app.use express.static("/home/ywang2/node/liquid_perf/public");
app.use(express.static(__dirname + '/public'));

connection.connect(function(err){
        if(!err) {
            console.log("Database is connected ... \n\n");  
        } else {
            console.log("Error connecting database ... \n\n");  
        }
    });

// sample to demonstrate response and request
app.get("/test",function(req,res){
        connection.query('SELECT * from liquid_perf LIMIT 2', function(err, rows, fields) {
                //connection.end();
                if (!err) {
                    // console.log('The solution is: ', rows);
                    res.send(req.query.starttime);
                }
                else
                    console.log('Error while performing Query.');
            });
    });

// get all runs between a time range
app.get("/getAllRuns",function(req,res) {
        var min_start = new Date();
        var max_start = new Date();
        //var min_start = "33";
        connection.query('SELECT MIN(time), MAX(time) from date_hash', function(err, rows, fields) {
                if (!err) {
                    min_start = rows[0]["MIN(time)"];
                    max_start = rows[0]["MAX(time)"];
                }
                else {
                    console.log('Error while fetching range.');
                    res.send("");
                }
                console.log(min_start, max_start);
                connection.query('SELECT * from date_hash where time between \'' + 
                                 min_start.toISOString().slice(0, 19).replace('T', ' ') + 
                                 '\' and \'' + max_start.toISOString().slice(0, 19).replace('T', ' ') + 
                                 '\'', function(err, rows, fields) {
                        if (!err) {
                            console.log(rows[0].time);
                            res.send(rows);
                        }
                        else {
                            console.log('Error while performing Query.');
                            res.send("");
                        }
                                 });
            });
    });

app.get("/getAllRuns",function(req,res) {
        var min_start = new Date();
        var max_start = new Date();
        //var min_start = "33";
        connection.query('SELECT MIN(time), MAX(time) from date_hash', function(err, rows, fields) {
                if (!err) {
                    min_start = rows[0]["MIN(time)"];
                    max_start = rows[0]["MAX(time)"];
                }
                else {
                    console.log('Error while fetching range.');
                    res.send("");
                }
                console.log(min_start, max_start);
                connection.query('SELECT * from date_hash where time between \'' + 
                                 min_start.toISOString().slice(0, 19).replace('T', ' ') + 
                                 '\' and \'' + max_start.toISOString().slice(0, 19).replace('T', ' ') + 
                                 '\'', function(err, rows, fields) {
                        if (!err) {
                            console.log(rows[0].time);
                            res.send(rows);
                        }
                        else {
                            console.log('Error while performing Query.');
                            res.send("");
                        }
                                 });
            });
    });

app.get("/getAllTests",function(req,res){
        connection.query('SELECT DISTINCT testname from liquid_perf', function(err, rows, fields) {
                if (!err) {
                    res.send(rows);
                }
                else {
                    console.log('Error while fetching range.');
                    res.send("");
                }
            });
    });

app.get("/getTestRuntime", function(req,res){
        var test = req.query.testname;
        console.log("get test runtime : test is:", test);
        connection.query('SELECT date, cycle, time_in_sec from test_runtime where testname=\"' + test + '\" order by date', function(err, rows, fields) {
                if (!err) {
                    res.send(rows);
                }
                else {
                    console.log('Error while fetching range.');
                    res.send("");
                }
            });
    });




app.get("/",function(req,res){
        res.sendfile('./public/views/charts.html');
    });

app.listen(8080);