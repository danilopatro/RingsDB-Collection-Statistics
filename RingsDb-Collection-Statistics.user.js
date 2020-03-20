// ==UserScript==
// @name         RingsDB Collection Statistics
// @namespace    http://tampermonkey.net/
// @version      5
// @description  Generate information (table and graphs) about your collection informed at RingsDB.com.
// @author       Danilo
// @copyright    2020, Danilo (https://github.com/danilopatro)
// @license      Apache-2.0
// @homepage     https://github.com/danilopatro/RingsDB-Collection-Statistics
// @supportURL   https://github.com/danilopatro/RingsDB-Collection-Statistics/issues
// @icon         https://raw.githubusercontent.com/danilopatro/RingsDB-Collection-Statistics/master/icon-192.ico
// @match        *://www.ringsdb.com/collection/*
// @match        *://ringsdb.com/collection/*
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require      https://code.jquery.com/ui/1.12.1/jquery-ui.js
// @require      https://www.chartjs.org/samples/latest/utils.js
// @require      https://www.chartjs.org/dist/2.9.3/Chart.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels
// @resource     jqueryCSS https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.css
// @run-at       document-idle
// ==/UserScript==

var cards_api_url = 'https://www.ringsdb.com/api/public/cards/';
var packs_api_url = 'https://www.ringsdb.com/api/public/packs/';
var collection_url = 'https://www.ringsdb.com/collection/packs';

var Cards = new Array();
var Sets = new Array();
var Collection = new Array();
var Collection_codes = new Array();
var Cards_Collection = new Array();
var Cards_Quantity = 0;
var Cards_Quantity_total = 0;
var Packs_Quantity = new Array();
var Packs_Quantity_total = new Array();
var Packs_Quantity_unique = new Array();
var Packs_Quantity_unique_total = new Array();
var Sphere_Quantity = new Array();
var Sphere_Quantity_total = new Array();
var Sphere_Quantity_unique = new Array();
var Sphere_Quantity_unique_total = new Array();
var Type_Quantity = new Array();
var Type_Quantity_total = new Array();
var Type_Quantity_unique = new Array();
var Type_Quantity_unique_total = new Array();

var Sphere_colors = {Tactics: '#ED2E30', Spirit: '#00B1D4', Leadership: '#AD62A5', Lore: '#51B848', Neutral: '#616161', Baggins: '#B39E26', Fellowship: '#B56C0C'};
var Sphere_symbols = {Tactics: '<span class="icon icon-tactics fg-tactics"></span>',
                      Spirit: '<span class="icon icon-spirit fg-spirit"></span>',
                      Leadership: '<span class="icon icon-leadership fg-leadership"></span>',
                      Lore: '<span class="icon icon-lore fg-lore"></span>',
                      Neutral: '<span class="icon icon-neutral fg-neutral"></span>',
                      Baggins: '<span class="icon icon-baggins fg-baggins"></span>',
                      Fellowship: '<span class="icon icon-fellowship fg-fellowship"></span>'};

var Type_colors = {Hero: '#dc9336', Ally: '#b15553', Event: '#509aaf', Attachment: '#77ad52', 'Player Side Quest': '#878a75', Treasure: '#c4c23b'};


var newCSS = GM_getResourceText ("jqueryCSS");
GM_addStyle (newCSS);
GM_addStyle("#base {  width: 100%; height: 100%; display: none; }");
GM_addStyle(".table_canvas {  width: 100%; border-collapse:separate; border-spacing: 10px 15px; }");
GM_addStyle(".table_canvas td {  width: 50%; }");
GM_addStyle(".table_canvas th {  padding: 5px; text-align: center; font-size: 15px; background-color: #eee; width: 33%; ; border-collapse:separate; border: 1px solid #DDD; -webkit-box-shadow: 3px 3px 10px -5px rgba(0,0,0,0.75); -moz-box-shadow: 3px 3px 10px -5px rgba(0,0,0,0.75); box-shadow: 3px 3px 10px -5px rgba(0,0,0,0.75);}");
GM_addStyle(".table_cards {  width: 100%; text-align: center; border-collapse:separate; border: 1px solid #DDD; -webkit-box-shadow: 3px 3px 10px -5px rgba(0,0,0,0.75); -moz-box-shadow: 3px 3px 10px -5px rgba(0,0,0,0.75); box-shadow: 3px 3px 10px -5px rgba(0,0,0,0.75); }");
GM_addStyle(".table_cards th {  padding: 5px; text-align: center; background-color: #eee; width: 33%; }");
GM_addStyle(".table_cards td {  padding: 5px; width: 33%; }");
GM_addStyle(".table_cards td:first-child {  text-align: left; padding-left: 10%; }");
GM_addStyle(".table_cards tr:nth-child(odd) {  background-color: #f5f5f5; }");
GM_addStyle(".table_cards tr:last-child {  background-color: #eee; }");
GM_addStyle("canvas {  width: 100%; height: 100%; }");

var graph_width = '100%';
var graph_height = graph_width;

/**
 * Get HTML asynchronously
 * @param  {String}   url      The URL to get HTML from
 * @param  {Function} callback A callback funtion. Pass in "response" variable to use returned HTML.
 */
var getHTML = function ( url, callback ) {

    // Feature detection
    if ( !window.XMLHttpRequest ) return;

    // Create new request
    var xhr = new XMLHttpRequest();

    // Setup callback
    xhr.onload = function() {
        if ( callback && typeof( callback ) === 'function' ) {
            callback( this.responseXML );
        }
    }

    // Get the HTML
    xhr.open( 'GET', url );
    xhr.responseType = 'document';
    xhr.send();

};

function criaDIV(stringCollection){
    var html_corpo = " \
<TABLE class='table_cards'>"+generateTable(Sphere_Quantity_unique, Sphere_Quantity)+"</TABLE> \
<br><button style='padding: 4px;' onclick=\"$(\'#base\').toggle()\">Show/Hide Charts</button><br><br> \
<div id='base' > \
<TABLE class='table_canvas'> \
<TR> \
<TH COLSPAN='2'>Graphs by Sphere</TH>\
</TR> <TR> \
<TD> <canvas  width='"+graph_width+"' height='"+graph_height+"' id='sphere'> </canvas > </TD>\
<TD> <canvas  width='"+graph_width+"' height='"+graph_height+"' id='spherePie'> </canvas > </TD>\
</TR> <TR> \
<TH COLSPAN='2'>Graphs by Type</TH>\
</TR> <TR> \
<TD> <canvas  width='"+graph_width+"' height='"+graph_height+"' id='type'> </canvas > </TD>\
<TD> <canvas  width='"+graph_width+"' height='"+graph_height+"' id='typePie'> </canvas > </TD>\
</TR> <TR> \
<TH COLSPAN='2'>Status of the Collection</TH>\
</TR> <TR> \
<TD> <canvas  width='"+graph_width+"' height='"+graph_height+"' id='total'> </canvas > </TD>\
<TD> <canvas  width='"+graph_width+"' height='"+graph_height+"' id='spherePolar'> </canvas > </TD>\
</TR> \
</TABLE> \
</div>";
    return html_corpo;
};

function carregaCollection (response) {

    var someElement = $( "label[class*='active']" , response).get();

    if(someElement == null || someElement.length == 0)
        console.log("Not logged in RingsDb.com");
    else {
        for(var i = 0; i < someElement.length; i++) {
            Collection.push(someElement[i].innerHTML);
        }
        filterCollection();
    }
}

function filterCollection () {
    for(var i = 0; i < Sets.length; i++) {
        if(Collection.includes(Sets[i].name)) {
            Collection_codes.push(Sets[i].code);
        }
    }
    filterCards();
    inputSearchString();
}

function inputSearchString () {
    if(Collection_codes.length == 0)
        console.log("No code loaded.");
    else {
        $(criaDIV(" e:"+Collection_codes.join("|"))).insertBefore($("#owned_packs form"));
        geraChart(Sphere_Quantity, 'All cards', 'sphere', 'bar', Sphere_Quantity_unique, 'Distinct cards');
        geraChart(Sphere_Quantity, 'All cards', 'spherePie', 'pie', Sphere_Quantity_unique, 'Distinct cards');
        geraChart(Type_Quantity, 'All cards', 'type', 'bar', Type_Quantity_unique, 'Distinct cards');
        geraChart(Type_Quantity, 'All cards', 'typePie', 'pie', Type_Quantity_unique, 'Distinct cards');
        geraChart(Sphere_Quantity_unique, 'Distinct cards', 'spherePolar', 'polarArea', new Array(), '', Sphere_Quantity_unique_total);
        geraChart(Cards_Quantity_total, 'Total', 'total', 'bar', Cards_Quantity, '', new Array());
    }
}

function loadCards (callback) {
    $.getJSON(cards_api_url, function(data) {
        for(var i = 0; i < data.length; i++) {
            Cards.push({
                code: data[i].code,
                pack_name: data[i].pack_name,
                sphere_name:  data[i].sphere_name,
                type_name:  data[i].type_name,
                quantity:  data[i].quantity
            });
        }
    });
    if ( callback && typeof( callback ) === 'function' ) {
        callback();
    }
}

function loadSets (callback) {
    $.getJSON(packs_api_url, function(data) {
        for(var i = 0; i < data.length; i++) {
            Sets.push({
                code: data[i].code,
                name:  data[i].name
            });
        }
    });
    if ( callback && typeof( callback ) === 'function' ) {
        callback();
    }
    getHTML(collection_url, carregaCollection);
}

function filterCards () {
    for(var i = 0; i < Cards.length; i++) {
        Cards_Quantity_total += Cards[i].quantity;
        Packs_Quantity_total[Cards[i].pack_name] = isNaN(Packs_Quantity_total[Cards[i].pack_name]) ? Cards[i].quantity : Packs_Quantity_total[Cards[i].pack_name] + Cards[i].quantity;
        Packs_Quantity_unique_total[Cards[i].pack_name] = isNaN(Packs_Quantity_unique_total[Cards[i].pack_name]) ? 1 : Packs_Quantity_unique_total[Cards[i].pack_name] + 1;
        Sphere_Quantity_total[Cards[i].sphere_name] = isNaN(Sphere_Quantity_total[Cards[i].sphere_name]) ? Cards[i].quantity : Sphere_Quantity_total[Cards[i].sphere_name] + Cards[i].quantity;
        Sphere_Quantity_unique_total[Cards[i].sphere_name] = isNaN(Sphere_Quantity_unique_total[Cards[i].sphere_name]) ? 1 : Sphere_Quantity_unique_total[Cards[i].sphere_name] + 1;
        Type_Quantity_total[Cards[i].type_name] = isNaN(Type_Quantity_total[Cards[i].type_name]) ? Cards[i].quantity : Type_Quantity_total[Cards[i].type_name] + Cards[i].quantity;
        Type_Quantity_unique_total[Cards[i].type_name] = isNaN(Type_Quantity_unique_total[Cards[i].type_name]) ? 1 : Type_Quantity_unique_total[Cards[i].type_name] + 1;
        if(Collection.includes(Cards[i].pack_name)) {
            Cards_Collection.push([Cards[i].pack_name,
                                   Cards[i].sphere_name,
                                   Cards[i].type_name,
                                   Cards[i].quantity]);
            Cards_Quantity += Cards[i].quantity;
            Packs_Quantity[Cards[i].pack_name] = isNaN(Packs_Quantity[Cards[i].pack_name]) ? Cards[i].quantity : Packs_Quantity[Cards[i].pack_name] + Cards[i].quantity;
            Packs_Quantity_unique[Cards[i].pack_name] = isNaN(Packs_Quantity_unique[Cards[i].pack_name]) ? 1 : Packs_Quantity_unique[Cards[i].pack_name] + 1;
            Sphere_Quantity[Cards[i].sphere_name] = isNaN(Sphere_Quantity[Cards[i].sphere_name]) ? Cards[i].quantity : Sphere_Quantity[Cards[i].sphere_name] + Cards[i].quantity;
            Sphere_Quantity_unique[Cards[i].sphere_name] = isNaN(Sphere_Quantity_unique[Cards[i].sphere_name]) ? 1 : Sphere_Quantity_unique[Cards[i].sphere_name] + 1;
            Type_Quantity[Cards[i].type_name] = isNaN(Type_Quantity[Cards[i].type_name]) ? Cards[i].quantity : Type_Quantity[Cards[i].type_name] + Cards[i].quantity;
            Type_Quantity_unique[Cards[i].type_name] = isNaN(Type_Quantity_unique[Cards[i].type_name]) ? 1 : Type_Quantity_unique[Cards[i].type_name] + 1;

        }
    }
}

// @source https://stackoverflow.com/questions/1058427/how-to-detect-if-a-variable-is-an-array
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

// @source https://stackoverflow.com/questions/6823286/create-unique-colors-using-javascript
function randomColors(total, color = 240)
{
    var i = 40 / (total - 1); // distribute the colors evenly on the hue range
    var r = []; // hold the generated colors
    for (var x=0; x<total; x++)
    {
        r.push(get_random_color(30+x*i, color)); // you can also alternate the saturation and value for even more contrast between the colors
    }
    return r;
}

function rand(min, max) {
    return min + Math.random() * (max - min);
}

function get_random_color(i, color) {
    var h = rand(color, color);
    var s = rand(100, 100);
    var l = rand(i, i);
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}

function numberWithPoints(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".");
}

function hideShow(element) {
    var x = document.getElementById(element);
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}

function generateTable(data, data2, headers = ['Sphere','Number of distinct cards','Total number of cards' ]) {
    var html = '<tr>\r\n<th nowrap>' + headers[0] + '</th><th nowrap>' + headers[1] + '</th><th nowrap>'+ headers[2] + '</th></tr>\r\n';
    var data_labels = Object.getOwnPropertyNames(data);
    var n_cards = 0;
    var q_cards = 0;
    data_labels.shift();
    data = Object.values(data);
    data2 = Object.values(data2);
    if (typeof (data[0]) === 'undefined') {
        return null;
    }

    for (var row = 0; row < data.length; row++) {
        html += '<tr class="fg-'+data_labels[row].toLowerCase() +'">\r\n';
        html += '<td>' + returnSymbol(data_labels[row]) + '</td><td>' + data[row] + '</td><td>' + data2[row] + '</td>\r\n';
        html += '</tr>\r\n';
        n_cards += data[row];
        q_cards += data2[row];
    }
    html += '<tr>\r\n';
    html += '<td><b>TOTAL</b></td><td><b>' + n_cards + '</b></td><td><b>' + q_cards + '</b></td>\r\n';
    html += '</tr>\r\n';
    return html;
}

function returnSymbol(sphere) {
    var labels_info = Object.getOwnPropertyNames(Sphere_symbols);
    return Sphere_symbols[sphere] + " " + sphere;
}

function divideArrays(A1, A2) {
    var temp = new Array();
    var kA1 = Object.getOwnPropertyNames(A1);
    kA1.shift();
    for (var x = 0; x < kA1.length; x++) {
        temp[kA1[x]] = A1[kA1[x]]/A2[kA1[x]];
    }
    return temp;
}

// @source https://stackoverflow.com/questions/5223/length-of-a-javascript-object
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

loadCards(loadSets);

function geraChart(info, name, canvas, type = 'bar', info2 = info, name2 = name, info_tot = info, info2_tot = info2) {
    info = isArray(info) ? info : [info];
    info2 = isArray(info2) ? info2 : [info2];
    var labels_info = Object.getOwnPropertyNames(info);
    labels_info.shift();
    var values_info = canvas == 'spherePolar' ? Object.values(divideArrays(info,info_tot)) : Object.values(info);
    var values_info2 = canvas == 'spherePolar' ? values_info2 = Object.values(divideArrays(info2,info2_tot)) : Object.values(info2);
    var data1 = {
        label: name,
        data: values_info,
        backgroundColor: function(context) {
            var index = context.dataIndex;
            var value = context.dataset.data[index];
            return Object.getOwnPropertyNames(Sphere_colors).includes(labels_info[index]) ? Sphere_colors[labels_info[index]] :    // For Sphere graph
            Object.getOwnPropertyNames(Type_colors).includes(labels_info[index]) ? Type_colors[labels_info[index]] :    // For Type graph
            labels_info[0] == 'Core Set' ? Object.values(randomColors(Object.size(labels_info), 0)) : // for Pack graph
            'rgb(255,0,0,.1)';
        },
        borderWidth: ['pie', 'polarArea'].indexOf(type) > -1 ? 2 :
        canvas == 'total' ? 1 : 0,
        borderColor: canvas == 'total' ? "rgb(255,0,0,.5)" : "#fff",
        borderAlign: 'inner',
        order: 2,
    };
    var data2 = {
        label: name2,
        data: values_info2,
        backgroundColor: function(context) {
            var index = context.dataIndex;
            var value = context.dataset.data[index];
            return Object.getOwnPropertyNames(Sphere_colors).includes(labels_info[index]) ? Sphere_colors[labels_info[index]] :    // For Sphere graph
            Object.getOwnPropertyNames(Type_colors).includes(labels_info[index]) ? Type_colors[labels_info[index]] :    // For Type graph
            labels_info[0] == 'Core Set' ? Object.values(randomColors(Object.size(labels_info), 0)) : // for Type graph
            'rgb(0,0,255,.25)';
        },
        borderWidth: ['pie', 'polarArea'].indexOf(type) > -1 ? 2 : 0,
        borderColor: "#fff",
        borderAlign: 'inner',
        type: type == 'bar' ? 'line' : type,
        fill: type == 'bar' ? false : true,
        showLine: false,
        //canvas == 'total'
        lineTension: 0,
        pointStyle: 'circle',
        pointradius: 5,
        pointHoverRadius: 15,
        pointBorderWidth: 1,
        pointHoverBorderWidth: 2,
        pointBorderColor: "#fff",
        order: 1,
    };
    var data3 = {
        label: name2,
        data: values_info2,
        type: type,
        backgroundColor: function(context) {
            var index = context.dataIndex;
            var value = context.dataset.data[index];
            return Object.getOwnPropertyNames(Sphere_colors).includes(labels_info[index]) ? Sphere_colors[labels_info[index]] :    // For Sphere graph
            Object.getOwnPropertyNames(Type_colors).includes(labels_info[index]) ? Type_colors[labels_info[index]] :    // For Type graph
            labels_info[0] == 'Core Set' ? Object.values(randomColors(Object.size(labels_info), 0)) : // for Type graph
            canvas == 'total' ? 'rgb(255,0,0,1)' :
            'rgb(255,0,0,.25)';
        },
        borderWidth: ['pie', 'polarArea'].indexOf(type) > -1 ? 2 : 0,
        borderColor: "#fff",
        borderAlign: 'inner',
        fill: type == 'bar' ? true : true,
        showLine: false,
        order: 1,
        datalabels: {
            labels: {
                value: {
                    color: 'white',
                    font: {
                        size: 18,
                    },
                }
            }
        }
    };
    var data4 = {
        label: name,
        data: values_info,
        backgroundColor: function(context) {
            var index = context.dataIndex;
            var value = context.dataset.data[index];
            return Object.getOwnPropertyNames(Sphere_colors).includes(labels_info[index]) ? Sphere_colors[labels_info[index]] :    // For Sphere graph
            Object.getOwnPropertyNames(Type_colors).includes(labels_info[index]) ? Type_colors[labels_info[index]] :    // For Type graph
            labels_info[0] == 'Core Set' ? Object.values(randomColors(Object.size(labels_info), 0)) : // for Pack graph
            'rgb(255,0,0,.1)';
        },
        borderWidth: ['pie', 'polarArea'].indexOf(type) > -1 ? 2 :
        canvas == 'total' ? 1 : 0,
        borderColor: canvas == 'total' ? "rgb(255,0,0,.5)" : "#fff",
        borderAlign: 'inner',
        order: 2,
        datalabels: {
            labels: {
                value: {
                    color: canvas == 'total' ? 'red' : null,
                    font: {
                        size: 18,
                    },
                }
            }
        }
    };
    var barChartData = {
        labels: labels_info,
        datasets: isNaN(info2) ? [ data1 ] : [ canvas == 'total' ? data4 : data1, canvas == 'total' ? data3 : data2 ],
    };
    var ctx = document.getElementById(canvas).getContext('2d');
    var defaultOptions = {
        responsive: true,
        legend: {
            display: false,
            position: 'bottom',
            labels: {
                usePointStyle: true,
            },
        },
        tooltips: {
            mode: type == 'pie' ? 'dataset' : 'index',
            intersect: true,
            position: type == 'pie' ? 'nearest' : 'average',
            callbacks: {
                title: function(tooltipItem, data) {
                    //console.log(data.labels[tooltipItem]);
                    return type == 'pie' ? data.datasets[tooltipItem[0].datasetIndex].label+':' : tooltipItem[0].xLabel+':';
                },
            },
        },
        title: {
            display: false,
            text: name+' Chart'
        },
        plugins: {
            datalabels: {
                anchor: type == 'pie' ? 'center' : 'end',
                align: 'bottom',
                display: 'auto',
                formatter: (value, ctx) => {
                    let sum = 0;
                    let dataArr = ctx.chart.data.datasets[ctx.datasetIndex].data;
                    dataArr.map(data => {
                        sum += data;
                    });
                    let percentage = type == 'pie' ? labels_info[ctx.dataIndex]+"\n"+(value*100 / sum).toFixed(1)+"%" : value;
                    return percentage;
                },
                color: '#fff',
                labels: {
                    value: {
                        font: {
                            weight: 'bold'
                        },
                    },
                }
            }
        }
    };
    var stackedOptions = {
        responsive: true,
        legend: {
            display: false,
            position: 'bottom',
            labels: {
                usePointStyle: true,
            },
        },
        tooltips: {
            enabled: false,
            mode: type == 'pie' ? 'dataset' : 'index',
            intersect: true,
            position: type == 'pie' ? 'nearest' : 'average',
        },
        title: {
            display: true,
            text: 'Collection (distinct cards)'
        },
        scales: {
            xAxes: [{
                stacked: true
            }],
            yAxes: [{
                stacked: false,
                ticks: {
                    beginAtZero: true,
                    stepSize: 100,
                },
            }],
        },
        plugins: {
            datalabels: {
                anchor: type == 'pie' ? 'center' : 'end',
                align: 'bottom',
                display: 'auto',
                textAlign: 'center',
                formatter: (value, ctx) => {
                    let sum = 0;
                    let dataArr = ctx.chart.data.datasets[ctx.datasetIndex].data;
                    dataArr.map(data => {
                        sum += data;
                    });
                    let percentage = type == 'pie' ? labels_info[ctx.dataIndex]+"\n"+(value*100 / sum).toFixed(1)+"%" :
                    canvas == 'total' ? value+" cards\n"+(value*100 / Cards_Quantity_total).toFixed(1)+"% of the total" :
                    value;
                    percentage = value == Cards_Quantity_total ? value + ' cards published' : 'You own ' + value + " cards\n"+(value*100 / Cards_Quantity_total).toFixed(1)+"% of the total";
                    return percentage;
                },
                color: '#000',
            }
        },
    };
    var polarOptions = {
        responsive: true,
        legend: {
            display: true,
            position: 'right',
            labels: {
                usePointStyle: true,
            },
            onClick: null,
        },
        tooltips: {
            mode: type == 'pie' ? 'dataset' : 'index',
            intersect: true,
            position: type == 'pie' ? 'nearest' : 'average',
            callbacks: {
                label: function(tooltipItem, data) {
                    var label = data.labels[tooltipItem.index] || '';
                    label += ': ' + Sphere_Quantity_unique[data.labels[tooltipItem.index]] + ' of ' + Sphere_Quantity_unique_total[data.labels[tooltipItem.index]];
                    return label;
                },
            }
        },
        title: {
            display: true,
            text: 'Percent of '+name+' in the Collection in relation to those published by Sphere'
        },
        scale: {
            angleLines: {
            },
            ticks: {
                min: 0,
                max: 1,
                stepSize: 0.1,
                callback: function(value, index, values) {
                    return (value*100).toFixed(0)+"%";
                },
            },
        },
        plugins: {
            datalabels: {
                anchor: ['pie'].indexOf(type) > -1 ? 'center' :
                ['polarArea'].indexOf(type) > -1 ? 'end' :
                'end',
                align: ['pie'].indexOf(type) > -1 ? 'bottom' :
                ['polarArea'].indexOf(type) > -1 ? 'start' :
                'bottom',
                clamp: true,
                display: 'auto',
                formatter: (value, ctx) => {
                    let sum = 0;
                    let dataArr = ctx.chart.data.datasets[ctx.datasetIndex].data;
                    dataArr.map(data => {
                        sum += data;
                    });
                    let percentage = ['pie'].indexOf(type) > -1 ? labels_info[ctx.dataIndex]+"\n"+(value*100 / sum).toFixed(1)+"%" : // For Pie graph
                    ['polarArea'].indexOf(type) > -1 ? (value*100).toFixed(1)+"%" :    // For Polar Area graph
                    value;
                    return percentage;
                },
                color: '#fff',
            }
        },
    };
    var charBar = new Chart(ctx, {
        type: type,
        data: barChartData,
        options: type == 'polarArea' ? polarOptions :
        canvas == 'total' ? stackedOptions : defaultOptions,
    });
};
