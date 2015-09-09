window.addEventListener("load", initialize);

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};


function initialize() {
    var url = 'http://45.79.141.203:5000/get_names';
    $.ajax({
        url: url,
        success: function(data) {
            //console.log(JSON.stringify(data));

            var names = data.names;

            $('#the-basics .typeahead').typeahead({
              hint: true,
              highlight: true,
              minLength: 1
            },
            {
              name: 'names',
              source: substringMatcher(names)
            });
        },
        error: function(data) {
            console.log('nooo');
            console.log(data);
        }
    });


    $('#the-basics').bind('typeahead:selected', function(obj, datum, name) {      
            console.log(JSON.stringify(datum));
            var name = encodeURI(datum);
            var url = 'http://45.79.141.203:5000/get_relationship?name=' + name;
            console.log(url);
            updateGraph(url, datum);
    });

}

function updateGraph(url, datum) {
    $.ajax({
        url: url,
        success: function(x) {
            console.log(JSON.stringify(x.data));

            data = (x.data);
            console.log(data.length);

            var Matrix = function (rows, columns)  {
                this.rows = rows;
                this.columns = columns;
                this.myarray = new Array(this.rows);
                for (var i=0; i < this.columns; i +=1) {
                    this.myarray[i]=new Array(this.rows)
                }
                return this.myarray;
            }

            var days = new Matrix(2, data.length);
            console.log('days is');
            console.log(days);

            var totalMsgs = 0;
            var mostTalkedDay = []; 
            mostTalkedDay[0] = 0;

            var lastTalked = [];

            for (i=0; i<data.length; i++) {
                // console.log(data[i][0].year + ' ' + data[i][0].month + ' ' + data[i][0].day);
                days[i][0] = Date.UTC(data[i][0].year, data[i][0].month-1, data[i][0].day);
                days[i][1] = data[i][1];
                console.log(days[i][0] + ' ' + days[i][1]);
                totalMsgs = totalMsgs + parseInt(days[i][1]);
                console.log('total msgs is ' + totalMsgs);

                document.getElementById('totalMsg').innerHTML = totalMsgs;

                if (i==data.length-1) {
                    if (days[i][0] != 1441411200000) {
                        console.log('adding last day');
                        days.push([1441411200000, 0]);
                    }
                }

                if (mostTalkedDay[0] < data[i][1]) { //talked more on this day.
                    mostTalkedDay[0] = data[i][1];
                    mostTalkedDay[1] = data[i][0].year;
                    mostTalkedDay[2] = data[i][0].month;
                    mostTalkedDay[3] = data[i][0].day;
                    console.log(mostTalkedDay);
                    document.getElementById('talkedMost').innerHTML = mostTalkedDay[0] + ' messages on ' + mostTalkedDay[2] + '/' + mostTalkedDay[3] + '/' + mostTalkedDay[1];
                }

                if (data[i][1] != 0) { // if not 0, then keep it up.
                    lastTalked[0] = data[i][0].year;
                    lastTalked[1] = data[i][0].month;
                    lastTalked[2] = data[i][0].day;
                    document.getElementById('lastTalk').innerHTML = lastTalked[1] + '/' + lastTalked[2] + '/' + lastTalked[0];;

                }

            }

            $('#container').highcharts({
            chart: {
                zoomType: 'x'
            },
            title: {
                text: datum
            },
            subtitle: {
                text: document.ontouchstart === undefined ?
                        'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
            },
            xAxis: {
                type: 'datetime'
            },
            yAxis: {
                title: {
                    text: 'Messages Exchanged'
                },
                min:0
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 1,
                            y2: 1
                        },
                        stops: [
                            [0, Highcharts.getOptions().colors[3]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[3]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 2
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                }
            },

            series: [{
                type: 'area',
                name: 'USD to EUR',
                data: days
            }]
        });

        },
        error: function(data) {
            console.log('nooo');
            console.log(data);
        }
    });
}
