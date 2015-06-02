// get request
function HttpGet(path, callback) {
    var xmlhttp;
    // code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp=new XMLHttpRequest();

    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
            {
                document.getElementById("all_runs").innerHTML=xmlhttp.responseText;
                var jsonResponse = JSON.parse(xmlhttp.responseText);
                callback(jsonResponse);
            }
    }
    xmlhttp.open("GET",path,true);
    xmlhttp.send();
}

function drawChart(rows) {
    // Create the data table.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Topping');
    data.addColumn('number', 'Slices');
    /*
    data.addRows([
                  ['Mushrooms', 3],
                  ['Onions', 1],
                  ['Olives', 1],
                  ['Zucchini', 1],
                  ['Pepperoni', 2]
                  ]);
    */

    var jsrows = [];
    var i;
    for (i=0; i < rows.length; i++) {
        var element = [rows[i].testname, 1];
        jsrows.push(element);
    }

    data.addRows(jsrows);

    // Set chart options
    var options = {'title':'How Much Pizza I Ate Last Night',
                   'width':1200,
                   'height':900};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}

function fillTestnameDropDown(rows) {
    var testnames = document.getElementById("testnames");

    while (testnames.hasChildNodes()) {
        testnames.removeChild(testnames.lastChild);
    }
    var i;
    for (i = 0; i < rows.length; i++) {
        var option = document.createElement("option");
        option.value = rows[i].testname;
        option.textContent = rows[i].testname;
        testnames.appendChild(option);
    };
};

function fillAllRuns(runs, select_id) {
    var selector = document.getElementById(select_id);

    while (selector.hasChildNodes()) {
        selector.removeChild(selector.lastChild);
    }
    var i;
    for (i = 0; i < runs.length; i++) {
        var option = document.createElement("option");
        var time = new Date(runs[i].time);
        option.value = runs[i].hash;
        option.textContent = time;
        selector.appendChild(option);
    };
};


// show the runtime of a given test
function handleTestChange() {
    var test = document.getElementById("testnames").value;
    HttpGet("/getTestRuntime?testname=" + test, function(rows) {
            // update the div
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'date');
            data.addColumn('number', 'seconds');
            // data.addColumn('number', 'cpu cycle');

            var jsrows = [];
            var i;
            for (i=0; i < rows.length; i++) {
                var element = [rows[i].date, rows[i].time_in_sec/* , rows[i].cycle */];
                jsrows.push(element);
            }
            data.addRows(jsrows);
            // Set chart options
            var options = {'title':test + " history run time",
                           'width':1200,
                           'height':900
            };

            // Instantiate and draw our chart, passing in some options.
            var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
            chart.draw(data, options);
        });
}

// update the perf results of selected runs on the left
function handleLeftRunChange() {
    handleLeftOrRightChange("left");
    return;
   var hash = document.getElementById("left_run_sel").value;
    HttpGet("/getAllPerfFromRun?run_hash=" + hash, function(rows) {
            var div = document.getElementById("comp_left");
            div.innerHTML = '';
            for (var i=0; i<rows.length; i++) {
                div.innerHTML += '<br><b>' + rows[i].testname + '</b><br>';
                div.innerHTML += '<br>';
                var functions = rows[i].functions;
                for (var j=0; j<functions.length; j++) {
                    div.innerHTML += functions[j].percentage + '%  ' + functions[j].funcname + '<br>';
                }
            }
            div.innerHTML += '<br>';
        });
    showNewComparison();
}

function handleRightRunChange() {
    handleLeftOrRightChange("right");
}

function handleLeftOrRightChange(direction) {
    var hash = document.getElementById(direction + "_run_sel").value;
    HttpGet("/getAllPerfFromRun?run_hash=" + hash, function(rows) {
            var div = document.getElementById("comp_" + direction);
            div.innerHTML = '';
            for (var i=0; i<rows.length; i++) {
                div.innerHTML += '<br><b>' + rows[i].testname + '</b><br>';
                div.innerHTML += '<br>';
                var functions = rows[i].functions;
                for (var j=0; j<functions.length && j<15; j++) {
                    div.innerHTML += functions[j].percentage + '%  ' + functions[j].funcname + '<br>';
                }
            }
            div.innerHTML += '<br>';
        });
    showNewComparison();
}

function showNewComparison() {
    var left_hash = document.getElementById("left_run_sel").value;
    var right_hash = document.getElementById("right_run_sel").value;
    HttpGet("/getAllPerfFromRun?run_hash=" + left_hash, function(left_rows) {
            HttpGet("/getAllPerfFromRun?run_hash=" + right_hash, function(right_rows) {
                    var div = document.getElementById("comp_result");
                    var left_testtable = {};
                    for (var i=0; i<left_rows.length; i++) {
                        var testname = left_rows[i]["testname"];
                        left_testtable[testname] = left_rows[i].functions;
                    }
                    var right_testtable = {};
                    for (var i=0; i<right_rows.length; i++) {
                        right_testtable[right_rows[i]["testname"]] = right_rows[i].functions;
                    }
                    /*
                    for (var i=0; i<right_rows.length; i++) {
                        if(testtable.hasOwnProperty(right_rows[i]["testname"])) {
                            testtable[right_rows[i].testname] = 2;
                        }
                    }
                    */
                    for (var test in left_testtable) {
                        //div.innerHTML += ' found one test in left ' + test;
                        if (right_testtable.hasOwnProperty(test)) {
                            //div.innerHTML += 'found one test in right also' + test;
                            // analyze diff of the two arrays
                            var left = left_testtable[test];
                            var right =right_testtable[test];
                            // store all left functions into a map
                            var left_map = {};
                            for (var j=0; j<left.length; j++) {
                                left_map[left[j].funcname] = left[j].percentage;
                            }
                            var min_len = Math.min(left.length, right.length);
                            // check from the right
                            for (var j=0; j < right.length; j++) {
                                var func = right[j].funcname;
                                //div.innerHTML += 'probing using function: ' + func;
                                if (left_map.hasOwnProperty(func)) {
                                    var right_percent = right[j].percentage;
                                    var left_percent = left_map[func];
                                    //div.innerHTML += 'function ' + func + ' left:' + left_percent + ' right:' + right_percent;
                                    if (right_percent > 10 /* min percent to qualify */ && right_percent > left_percent && ((right_percent - left_percent)*1.0/left_percent > 0.4)) {
                                        div.innerHTML += '<br>Runtime change: in ' + test + ', function ' + func + 
                                            ' runtime percentage has increased from left:' + left_percent + ' to right:' + right_percent;
                                    }
                                }
                            }
                        }
                    }
                    
                });
        });
}