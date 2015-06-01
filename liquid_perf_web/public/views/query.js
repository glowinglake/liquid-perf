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
    var hash = document.getElementById("left_run_sel").value;
    HttpGet("/getAllPerfFromRun?run_hash=" + hash, function(rows) {
            /*
            var div = document.getElementById('comp_left');
            div.innerHTML = '';
            for (var i=0; i<rows.length; i++) {
                div.innerHTML = rows[i].div.innerHTML + 'Extra stuff';
            }
            */
        });
}
