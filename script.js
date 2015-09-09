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
            var sUrl = 'http://45.79.141.203:5000/get_relationship_sentiment?name=' + name;
            console.log(url);
            updateGraph(url, datum, sUrl);
    });

}

function updateGraph(url, datum, sUrl) {
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
            var avg = mostTalkedDay[0]/data.length;
            document.getElementById("avg").innerHTML = avg;
            document.getElementById("funfacts").style.display = "block";

            $.ajax({
                url: sUrl,
                success: function(y) {
                    console.log('aaaa yay');

                    ydata = (y.data);
                    console.log(ydata);
                    var senti = new Matrix(2, ydata.length);
                    var firstDate;
                    var totalSent = parseFloat(0);
                    var bestDate = [];
                    bestDate[0] = 0;
                    var worstDate = [];
                    worstDate[0] = 1;

                    for (i=0; i<ydata.length; i++) {
                        senti[i][0] = Date.UTC(ydata[i][0].year, ydata[i][0].month-1, ydata[i][0].day);
                        senti[i][1] = ydata[i][1];

                        console.log(senti[i][0] + ' ' + senti[i][1]);
                        var add = (parseFloat(senti[i][1]));

                        totalSent = totalSent + add;

                        if (i==data.length-1) {
                            if (senti[i][0] != 1441411200000) {
                                senti.push([1441411200000, 0]);
                            }
                        }

                        if (i==0) {
                            firstDate = senti[i][0];
                        }

                        if (bestDate[0] < senti[i][1]) {
                            bestDate[0] = senti[i][1];
                            bestDate[1] = ydata[i][0].year;
                            bestDate[2] = ydata[i][0].month;
                            bestDate[3] = ydata[i][0].day;
                            document.getElementById('mostPos').innerHTML = bestDate[2] + '/' + bestDate[3] + '/' + bestDate[1];

                        }

                        if (worstDate[0] > senti[i][1]) {
                            worstDate[0] = senti[i][1];
                            worstDate[1] = ydata[i][0].year;
                            worstDate[2] = ydata[i][0].month;
                            worstDate[3] = ydata[i][0].day;
                            document.getElementById('mostNeg').innerHTML = worstDate[2] + '/' + worstDate[3] + '/' + worstDate[1];

                        }

                    }

                    var avgSent = totalSent / ydata.length;

                    if (avgSent > 0.1 ) {
                        document.getElementById("attitude").innerHTML = "Positive";
                    }
                    else if (avgSent < 0.1 && avgSent > -0.1) {
                        document.getElementById("attitude").innerHTML = "Neutral";
                    }
                    else if (avgSent < -0.1) {
                        document.getElementById("attitude").innerHTML = "Negative";
                    }

                    document.getElementById("avgSen").innerHTML = avgSent;
                    document.getElementById("sentimentfacts").style.display = "block";




                    var zeroLine = new Matrix(2, 2);
                    console.log(zeroLine);
                    zeroLine[0][0] = firstDate;
                    zeroLine[0][1] = 0;
                    zeroLine[1][0] = 1441411200000;
                    zeroLine[1][1] = 0;


                         $('#container').highcharts({
                            chart: {
                                zoomType: 'x'
                            },
                            title: {
                                text: datum + ' Messages'
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
                                name: 'Messages',
                                data: days
                            }]
                        });   

                        

                         $('#container2').highcharts({
                            chart: {
                                zoomType: 'x'
                            },
                            title: {
                                text: datum + ' Sentiment'
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
                                            [0, Highcharts.getOptions().colors[7]],
                                            [1, Highcharts.Color(Highcharts.getOptions().colors[7]).setOpacity(0).get('rgba')]
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
                                type: 'line', 
                                name: 'Sentiment',
                                data: senti
                            }, {
                                type: 'line',
                                name: 'zeroLine',
                                data: zeroLine
                            }]
                        });   

                        },
                        error: function(data) {
                            console.log('nooo');
                            console.log(data);
                        }
                    });
                } 
                           });


}
