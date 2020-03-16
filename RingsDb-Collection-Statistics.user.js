// ==UserScript==
// @name         RingsDb Collection Statistics
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Generate information (table and graphs) about your collection informed at RingsDb.com.
// @author       Danilo
// @copyright    2020, Danilo (https://github.com/danilopatro)
// @license      Apache-2.0
// @homepage     https://github.com/danilopatro/RingsDb-Collection-Statistics
// @supportURL   https://github.com/danilopatro/RingsDb-Collection-Statistics/issues
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
var Packs_Quantity = new Array();
var Packs_Quantity_unique = new Array();
var Sphere_Quantity = new Array();
var Sphere_Quantity_unique = new Array();
var Type_Quantity = new Array();
var Type_Quantity_unique = new Array();

var Sphere_colors = {Tactics: '#ED2E30', Spirit: '#00B1D4', Leadership: '#AD62A5', Lore: '#51B848', Neutral: '#616161', Baggins: '#B39E26', Fellowship: '#B56C0C'};
var Sphere_symbols = {Tactics: '<span class="icon icon-tactics fg-tactics"></span>',
                      Spirit: '<span class="icon icon-spirit fg-spirit"></span>',
                      Leadership: '<span class="icon icon-leadership fg-leadership"></span>',
                      Lore: '<span class="icon icon-lore fg-lore"></span>',
                      Neutral: '<span class="icon icon-neutral fg-neutral"></span>',
                      Baggins: '<span class="icon icon-baggins fg-baggins"></span>',
                      Fellowship: '<span class="icon icon-fellowship fg-fellowship"></span>'};

var Type_colors = {Hero: '#E31A1C', Ally: '#1F78B4', Event: '#6A3D9A', Attachment: '#33A02C', 'Player Side Quest': '#F0027F', Treasure: '#FF7F00'};


var newCSS = GM_getResourceText ("jqueryCSS");
GM_addStyle (newCSS);
GM_addStyle("#base {  width: 100%; height: 100%; display: none; }");
GM_addStyle(".table_canvas {  width: 100%; }");
GM_addStyle(".table_canvas td {  width: 50%; }");
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
<br><button style='padding: 4px;' onclick=\"$(\'#base\').toggle()\">Show/Hide Charts</button><br> \
<div id='base' > \
<TABLE class='table_canvas'> \
<TR> \
<TD> <canvas  width='"+graph_width+"' height='"+graph_height+"' id='sphere'> </canvas > </TD>\
<TD> <canvas  width='"+graph_width+"' height='"+graph_height+"' id='spherePie'> </canvas > </TD>\
</TR> <TR> \
<TD> <canvas  width='"+graph_width+"' height='"+graph_height+"' id='type'> </canvas > </TD>\
<TD> <canvas  width='"+graph_width+"' height='"+graph_height+"' id='typePie'> </canvas > </TD>\
</TR> <TR> \
<TD COLSPAN=2> <canvas  width='"+graph_width+"' height='"+graph_height+"' id='pack'> </canvas > </TD>\
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
        geraChart(Sphere_Quantity, 'Spheres', 'sphere', 'bar', Sphere_Quantity_unique);
        geraChart(Sphere_Quantity, 'Spheres', 'spherePie', 'pie', Sphere_Quantity_unique);
        geraChart(Type_Quantity, 'Types', 'type', 'bar', Type_Quantity_unique);
        geraChart(Type_Quantity, 'Types', 'typePie', 'pie', Type_Quantity_unique);
        geraChart(Packs_Quantity, 'Packs', 'pack', 'bar', Packs_Quantity_unique);
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
        //console.log("Cards[i].pack_name: " + Cards[i].pack_name +"\n Collection.includes(Cards[i].pack_name): " + Collection.includes(Cards[i].pack_name));
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

function generateTable(data, data2, headers = ['Esfera','Nº de cartas diferentes','Quantidade de cartas' ]) {
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
    html += '<td><b>TOTAL</b></td><td><b>' + numberWithPoints(n_cards) + '</b></td><td><b>' + numberWithPoints(q_cards) + '</b></td>\r\n';
    html += '</tr>\r\n';
    return html;
}

function returnSymbol(sphere) {
    var labels_info = Object.getOwnPropertyNames(Sphere_symbols);
    return Sphere_symbols[sphere] + " " + sphere;
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

function geraChart(info, name, canvas, type = 'bar', info2 = info) {
    var labels_info = Object.getOwnPropertyNames(info);
    labels_info.shift();
    var values_info = Object.values(info);
    var values_info2 = Object.values(info2);
    var barChartData = {
        labels: labels_info,
        datasets: [{
            label: name,
            backgroundColor: function(context) {
                var index = context.dataIndex;
                var value = context.dataset.data[index];
                return Object.getOwnPropertyNames(Sphere_colors).includes(labels_info[index]) ? Sphere_colors[labels_info[index]] :    // For Sphere graph
                Object.getOwnPropertyNames(Type_colors).includes(labels_info[index]) ? Type_colors[labels_info[index]] :    // For Type graph
                labels_info[0] == 'Core Set' ? Object.values(randomColors(Object.size(labels_info), 0)) : // for Type graph
                'green';
            },
            borderWidth: type == 'pie' ? 2 : 0,
            borderColor: "#fff",
            data: values_info,
        }, {
            label: name,
            backgroundColor: function(context) {
                var index = context.dataIndex;
                var value = context.dataset.data[index];
                return Object.getOwnPropertyNames(Sphere_colors).includes(labels_info[index]) ? Sphere_colors[labels_info[index]] :    // For Sphere graph
                Object.getOwnPropertyNames(Type_colors).includes(labels_info[index]) ? Type_colors[labels_info[index]] :    // For Type graph
                labels_info[0] == 'Core Set' ? Object.values(randomColors(Object.size(labels_info), 0)) : // for Type graph
                'green';
            },
            borderWidth: type == 'pie' ? 2 : 0,
            borderColor: "#fff",
            data: values_info2,
        }
                  ]
    };
    var ctx = document.getElementById(canvas).getContext('2d');
    var charBar = new Chart(ctx, {
        type: type,
        data: barChartData,
        options: {
            responsive: true,
            legend: {
                display: false,
                position: 'top',
            },
            title: {
                display: true,
                text: name+' Chart'
            },
            plugins: {
                datalabels: {
                    anchor: type == 'pie' ? 'center' : 'end',
                    align: 'bottom',
                    display: 'auto',
                    formatter: (value, ctx) => {
                        let sum = 0;
                        let dataArr = ctx.chart.data.datasets[0].data;
                        dataArr.map(data => {
                            sum += data;
                        });
                        let percentage = type == 'pie' ? (value*100 / sum).toFixed(2)+"%" : value;
                        return percentage;
                    },
                    color: '#fff',
                }
            }
        }
    });
};
