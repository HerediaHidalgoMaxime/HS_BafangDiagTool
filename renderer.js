const tableify = require('tableify')
var Chart = require('chart.js');
const { ipcRenderer } = require('electron')

/* utils */
function showError(err)
{
    ipcRenderer.invoke("showDialog", err.message);
}

function updatePortList(ports)
{
    console.log('ports', ports);
    var com_select = document.getElementById("com_select");
    com_select.innerHTML = "";
    for(var idx=0;idx<ports.length;idx++)
    {
        var option = new Option(ports[idx].path, ports[idx].path);
        com_select.appendChild(option);
    }
}

function comOnClose()
{
    document.getElementById("connect_button").disabled = false;
    document.getElementById("disconnect_button").disabled = true;
}

function connectionEvt()
{
    document.getElementById("connect_button").disabled = true;
    connection(Startup,showError,comOnClose);
}
/* ----- */


var UpdatingRuntime = false


listSerialPorts(updatePortList,showError);
document.getElementById("refresh_button").addEventListener("click", listSerialPorts);

document.getElementById("connect_button").addEventListener("click", connectionEvt);
document.getElementById("disconnect_button").addEventListener("click", disconnect);


/* -------------- mecanism -----------------*/
function Startup()
{
    sendInit(
        function()
        {
            document.getElementById("connect_button").disabled = true;
            document.getElementById("disconnect_button").disabled = false;
            getThrottleInfo(function(){},function(){});
            getBasicSettings(function(){},function(){});
            getPedalAssistSettings(function(){},function(){});
            drawCharts();
        },
        function()
        {
            disconnect();
            ipcRenderer.invoke("showDialog", "unable to communicate with the controler");
        });
}

function UpdateUnknown()
{
    getUnknownValues(0x08);
    getUnknownValues(0x11);
    getUnknownValues(0x0A);
    getUnknownValues(0x22);
    getUnknownValues(0x27);


    if(!UpdatingRuntime)
    {
        UpdatingRuntime = true;
        UpdateRuntime();
    }
}

function UpdateRuntime()
{
    //draw
    updateChart();

    //remove one sample
    hist.sampleNum.shift();
    hist.throttle.shift();
    hist.speed.shift();
    hist.batteryLevel.shift();
    hist.current.shift();
    hist.status.shift();

    //add new
    hist.sampleNum.push(0);

    getThrottleValue();
    getSpeedValue();
    getBatteryLevelValue();
    getCurrentValue();
    getStatusValue(UpdateRuntime,null);
}


document.getElementById("UpdateUnknown").addEventListener("click", UpdateUnknown);
/* ------------------------------------------ */


/* ---------- chart ---------------*/
function dynamicColors() {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return "rgba(" + r + "," + g + "," + b + ", 0.5)";
}

function createDataset(label,color,data,axis)
{
    var dataset = {};
    dataset.label = label;
    dataset.backgroundColor = color,
    dataset.borderColor = color,
    dataset.data = data;
    dataset.yAxisID = axis;
    return dataset;
}

var chart;
var chart_percent;
var chart_state;
var chart_current;

var COLOR_PERCENT = "rgba(0,0,255,0.5)"
var COLOR_PERCENT_THROTTLE = "rgba(0,50,100,0.5)"
var COLOR_PERCENT_BATTERY = "rgba(50,0,100,0.5)"
var COLOR_AMP = "rgba(255,0,0,0.5)"
var COLOR_STATE = "rgba(0,255,0,0.5)"
var COLOR_SPEED = "rgba(200,127,0,0.5)"


function drawchart(canvasID)
{
    var _chart;
    var datasets = []
    datasets.push(createDataset("throttle",COLOR_PERCENT_THROTTLE,hist.throttle,"percent"));
    datasets.push(createDataset("speed",COLOR_SPEED,hist.speed,"speed"));
    datasets.push(createDataset("batteryLevel",COLOR_PERCENT_BATTERY,hist.batteryLevel,"percent"));
    datasets.push(createDataset("current",COLOR_AMP,hist.current,"A"));
    datasets.push(createDataset("status",COLOR_STATE,hist.status,"state"));

    if(chart)
    {
        chart.update();
        return chart;
    }
    else
    {
        var ctx = document.getElementById(canvasID).getContext('2d');
        _chart = new Chart(ctx, {
            // The type of chart we want to create
            type: 'line',

            // The data for our dataset
            data: {
                labels: hist.sampleNum,
                datasets: datasets
            },
        // Configuration options go here
        options: {
            animation: {
                duration: 0
            },
            scales: {
                percent: {
                type: 'linear',
                display: true,
                position: 'left',
                ticks: {color: COLOR_PERCENT},

                },
                speed: {
                type: 'linear',
                display: true,
                position: 'right',
                ticks: {color: COLOR_SPEED},
                // grid line settings
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
                },
                A: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: {color: COLOR_AMP},
                    // grid line settings
                    grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                state: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: {color: COLOR_STATE},
                    // grid line settings
                    grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
            }

        }
        });
        return _chart;
    }
}

function drawCharts()
{
    chart = drawchart("chart");
   // chart_percent = drawchart_helper("%","chart_percent");
  //  chart_state = drawchart_helper("state","chart_state");
   // chart_current = drawchart_helper("current","chart_current");
}



function updateChart()
{
    chart.update();
}







/*------------------------------------*/



var idx_allData = 0;
var rawData = [];
var curves = [];
var DataIdList = [];

function alreadyRegistered(id)
{
    for(var idx=0;idx<DataIdList.length;idx++)
    {
        if(DataIdList[idx] == id) return true;
    }
    return false;
}


function addCurve_short(label,txByte,byteId,type)
{
    var curve = {};

    curve.label = label+"("+txByte+":"+byteId+")";
    curve.type = type;
    curve.color = dynamicColors();
    curve.data = [];
    curve.txByte = txByte;
    curve.byteId = byteId;
    curve.size = "short";
    curves.push(curve);

    if(!alreadyRegistered(txByte)) DataIdList.push(txByte);
}

function addCurve(label,txByte,byteId,type)
{
    var curve = {};

    curve.label = label+"("+txByte+":"+byteId+")";
    curve.type = type;
    curve.color = dynamicColors();
    curve.data = [];
    curve.txByte = txByte;
    curve.byteId = byteId;
    curve.size = "byte";
    curves.push(curve);

    if(!alreadyRegistered(txByte)) DataIdList.push(txByte);
}


/*
throttle 14 ??
speed 7 ??
*/

//DataIdList.push(144); //unknown
//DataIdList.push(84);
//DataIdList.push(83);
//DataIdList.push(82);
//DataIdList.push(49); //??

//DataIdList.push(32);


//DataIdList.push(29); //1/speed ?
//DataIdList.push(28); //current ??
//DataIdList.push(17); //battery ??
//DataIdList.push(16); //compteur km ??
//DataIdList.push(15); //throttle ??
//DataIdList.push(14); //throttle
//DataIdList.push(11);
//DataIdList.push(10);
//DataIdList.push(8);
//DataIdList.push(7); //current ??
//DataIdList.push(6);
//DataIdList.push(1);

/*-------------------------------------------------*/

/* UNKNOWN */

/* --- does not move ---- */
//addCurve("",144,0,"plain"); //144
//addCurve("",144,1,"plain"); //64
//addCurve("",144,2,"plain"); //208

/* --- does not move ---- */
//addCurve("",84,0,"plain");  //84
//addCurve("",84,1,"plain");  //6
//addCurve("",84,2,"plain");  //11
//addCurve("",84,3,"plain");  //36
//addCurve("",84,4,"plain");  //1
//addCurve("",84,5,"plain");  //255
//addCurve("",84,6,"plain");  //40
//addCurve("",84,7,"plain");  //5
//addCurve("",84,8,"plain");  //178

/* --- does not move ---- */
//addCurve("",83,0,"plain");  //83
//addCurve("",83,1,"plain");  //11
//addCurve("",83,2,"plain");  //3
//addCurve("",83,3,"plain");  //255
//addCurve("",83,4,"plain");  //255
//addCurve("",83,5,"plain");  //35
//addCurve("",83,6,"plain");  //4
//addCurve("",83,7,"plain");  //4
//addCurve("",83,8,"plain");  //255
//addCurve("",83,9,"plain");  //10
//addCurve("",83,10,"plain");  //6
//addCurve("",83,11,"plain");  //5
//addCurve("",83,12,"plain");  //70
//addCurve("",83,13,"plain");  //219

/* --- does not move --- */
/* config PAS */
/*for(var byteid = 0;byteid<27;byteid++)
{
    addCurve("",82,byteid,"plain");  //82 24 41 20 0 20 30 40 50 60 70 80 90 100 0 100 100 100 100 100 100 100 100 100 52 1 102
}*/

//addCurve("",28,0,"plain");
//addCurve("",11,0,"state"); //bloqué sur 3
//addCurve("km",16,0,"plain");
//addCurve("rpm sensor delay ?",29,0,"plain");
//addCurve("rpm sensor delay ?",29,1,"plain");
//addCurve("rpm sensor delay ?",29,2,"plain");
//addCurve("",7,0,"plain"); //réagis au throttle
//addCurve("",6,0,"plain");
//addCurve("",28,1,"plain"); //quand charge/frein , diminue

/* TO VERIFY */
addCurve("RANGE",34,0,"plain");
addCurve("MOVING",49,0,"plain");

/* PLAIN */
addCurve("throttle",14,0,"plain");
addCurve("Battery voltage?",49,0,"plain");  //oscille entre 49 et 48 : tension batterie?

addCurve_short("wheel speed",32,0,"plain"); //wheel speed


/* CURRENT */
addCurve("current",10,0,"current"); // courant -> Where XX is current in amps x 2


/* % */
addCurve("Battery level",17,0,"%");

/* STATE */
addCurve("status",8,0,"state"); //1 au repos, 3 lors que frein
addCurve("inibit",15,0,"state"); //etat assistance //0 au repos , 1 quand frein
//addCurve("consigne??",1,0,"state"); //état ?


/*-------------------------------------------------*/








var timeoutObj;
function getAll()
{
    var buffer = Buffer.alloc(2);
    buffer[0] = 0x11;
    buffer[1] = rawData[idx_allData].txByte;
    decodeFct = dataDecode;
    nextRequest = function(){};
    timeoutObj = setTimeout(() => {dataDecode(0); console.warn('UART TIMEOUT !!!'); }, 1000);
    port.write(buffer, function (err, result) {
        if (err) {
            console.log('Error while sending message : ' + err);
        }
        if (result) {
            console.log('Response received after sending message : ' + result);
        }
    });
}

var updateChartcnt = 0;
function dataDecode(data)
{
    clearTimeout(timeoutObj);
    //console.log(idx_allData);

    rawData[idx_allData].rx = data;
    //rawData[idx_allData].hist.push(data[0]);

    for(var idx=0;idx<curves.length;idx++)
    {
        if(rawData[idx_allData].txByte == curves[idx].txByte)
        {
            if(curves[idx].size == "byte")
            {
                curves[idx].data.push(data[curves[idx].byteId]);
            }
            if(curves[idx].size == "short")
            {
                var data = ((data[curves[idx].byteId])*256) + data[curves[idx].byteId+1];
                curves[idx].data.push(data);
            }
        }
    }


    idx_allData++;

    if(idx_allData<rawData.length)
    {
        getAll();
    }
    else
    {
        console.log(rawData);

        var tmpData = [];
        for(var idx=0;idx<rawData.length;idx++)
        {
            var data = {};
            data.txByte = rawData[idx].txByte;
            data.rx = rawData[idx].rx;
            tmpData.push(data)
        }

        tableHTML = tableify(tmpData)
        document.getElementById('ports').innerHTML += tableHTML;

        updateChartcnt++;
        updateChart();

        idx_allData = 0;
        getAll();
    }
}





