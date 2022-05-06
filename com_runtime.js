/* ------------------ update display data ------------ */
Bafang.Runtime = {};
function getUnknownValues(byte)
{
    var buffer = Buffer.alloc(2);
    buffer[0] = 0x11;
    buffer[1] = byte;
    addRequest(buffer,UnknownValuesDecode,null,null)
}
Bafang.Runtime.unknown = [];
function UnknownValuesDecode(data)
{
    var request = currentRequest.buffer;
    //request.copy(currentRequest.Buffer);
    var requestExist = false;
    var unknown = {};

    for(var idx=0;idx<Bafang.Runtime.unknown.length;idx++)
    {
        if(request == Bafang.Runtime.unknown[idx].request )
        {
            unknown = Bafang.Runtime.unknown[idx];
            requestExist = true;
        }
    }

    unknown.request = request;
    unknown.answer = data;

    if(!requestExist)
    {
        Bafang.Runtime.unknown.push(unknown);
    }
    document.getElementById("Unknown").innerHTML = tableify(Bafang.Runtime.unknown);
}


Bafang.Runtime.data = {};
var hist = {};
hist.sampleNum = []
hist.throttle = []
hist.speed = []
hist.batteryLevel = []
hist.current = []
hist.status = []

var HIST_SIZE = 500;

for(var idx=0;idx<HIST_SIZE;idx++)
{
    hist.sampleNum.push(0);
    hist.throttle.push(0);
    hist.speed.push(0);
    hist.batteryLevel.push(0);
    hist.current.push(0);
    hist.status.push(0);
}

function getThrottleValue(callback,timeoutCallback)
{
    var buffer = Buffer.alloc(2);
    buffer[0] = 0x11;
    buffer[1] = 0x0E;
    addRequest(buffer,throttleValueDecode,callback,timeoutCallback)
}
function throttleValueDecode(data)
{
    console.log(data);
    Bafang.Runtime.data.Throttle = ((data[0]*100)/255) + "%";
    hist.throttle.push(((data[0]*100)/255) );
    document.getElementById("RuntimeData").innerHTML = tableify(Bafang.Runtime.data);
}




function getSpeedValue(callback,timeoutCallback)
{
    var buffer = Buffer.alloc(2);
    buffer[0] = 0x11;
    buffer[1] = 0x20;
    addRequest(buffer,speedDecode,callback,timeoutCallback)
}
function speedDecode(data)
{
    console.log(data);
    var data = ((data[0])*256) + data[1];
    Bafang.Runtime.data.Speed = data + "RPM";
    Bafang.Runtime.data.Speed_kmh = (Math.round(((data*Math.PI)*(Bafang.BasicSettings.WheelSize_val)*0.0254*60)/100)/10) + "km/h";
    hist.speed.push((Math.round(((data*Math.PI)*(Bafang.BasicSettings.WheelSize_val)*0.0254*60)/100)/10) );
    document.getElementById("RuntimeData").innerHTML = tableify(Bafang.Runtime.data);
}

function getBatteryLevelValue(callback,timeoutCallback)
{
    var buffer = Buffer.alloc(2);
    buffer[0] = 0x11;
    buffer[1] = 0x11;
    addRequest(buffer,batteryLevelDecode,callback,timeoutCallback)
}
function batteryLevelDecode(data)
{
    console.log(data);
    Bafang.Runtime.data.BatteryLevel = data[0] + "%";
    hist.batteryLevel.push(data[0]);
    document.getElementById("RuntimeData").innerHTML = tableify(Bafang.Runtime.data);
}

//https://endless-sphere.com/forums/viewtopic.php?t=94850
function getBatteryVoltageValue(callback,timeoutCallback)
{
    var buffer = Buffer.alloc(2);
    buffer[0] = 0x11;
    buffer[1] = 0x31;
    addRequest(buffer,batteryVoltageDecode,callback,timeoutCallback)
}
function batteryVoltageDecode(data)
{
    console.log(data);
    Bafang.Runtime.data.BatteryVoltage = data[0] + "V?"; //Bycycle moving/stationary ??
    document.getElementById("RuntimeData").innerHTML = tableify(Bafang.Runtime.data);
}


function getCurrentValue(callback,timeoutCallback)
{
    var buffer = Buffer.alloc(2);
    buffer[0] = 0x11;
    buffer[1] = 0x0A;
    addRequest(buffer,currentDecode,callback,timeoutCallback)
}
function currentDecode(data)
{
    console.log(data);
    Bafang.Runtime.data.Current = (data[0]/2)+"A";
    hist.current.push(data[0]/2);
    document.getElementById("RuntimeData").innerHTML = tableify(Bafang.Runtime.data);
}

function getStatusValue(callback,timeoutCallback)
{
    var buffer = Buffer.alloc(2);
    buffer[0] = 0x11;
    buffer[1] = 0x08;
    addRequest(buffer,statusDecode,callback,timeoutCallback)
}
function statusDecode(data)
{
    console.log(data);
    switch(data[0])
    {
        case 0:
            Bafang.Runtime.data.Status = "IDLE";
            break;
        case 1:
            Bafang.Runtime.data.Status = "PEDALING";
            break;
        case 2:
            Bafang.Runtime.data.Status = "?";
            break;
        case 3:
            Bafang.Runtime.data.Status = "BRAKE";
            break;
        default:
            Bafang.Runtime.data.Status = data[0];
            break;
    }
    hist.status.push(data[0]);
    document.getElementById("RuntimeData").innerHTML = tableify(Bafang.Runtime.data);
}


/* TO VERIFY */
// addCurve("RANGE",34,0,"plain");
// addCurve("MOVING",49,0,"plain");

// /* PLAIN */

// addCurve("Battery voltage?",49,0,"plain");  //oscille entre 49 et 48 : tension batterie?


// /* STATE */
// addCurve("status",8,0,"state"); //1 au repos, 3 lors que frein
// addCurve("inibit",15,0,"state"); //etat assistance //0 au repos , 1 quand frein
// //addCurve("consigne??",1,0,"state"); //état ?
/* --------------------------------------------------- */



/* --- write runtime --- */
function setPAS(PAS,callback,timeoutCallback)
{
    var buffer = Buffer.alloc(4);
    buffer[0] = 0x16;
    buffer[1] = 0x0B;
    switch(parseInt(PAS))
    {
        case 0:
            buffer[2] = 0x00;
            buffer[3] = 0x21;
        break;
        case 1:
            buffer[2] = 0x01;
            buffer[3] = 0x22;
        break;
        case 2:
            buffer[2] = 0x0B;
            buffer[3] = 0x2C;
        break;
        case 3:
            buffer[2] = 0x0C;
            buffer[3] = 0x2D;
        break;
        case 4:
            buffer[2] = 0x0D;
            buffer[3] = 0x2E;
        break;
        case 5:
            buffer[2] = 0x02;
            buffer[3] = 0x23;
        break;
        case 6:
            buffer[2] = 0x15;
            buffer[3] = 0x36;
        break;
        case 7:
            buffer[2] = 0x16;
            buffer[3] = 0x37;
        break;
        case 8:
            buffer[2] = 0x17;
            buffer[3] = 0x38;
        break;
        case 9:
            buffer[2] = 0x03;
            buffer[3] = 0x24;
        break;
        default:
            buffer[2] = 0x00;
            buffer[3] = 0x21;
        break;
    }
    addRequest(buffer,noDecode,callback,timeoutCallback,true)
}

function setLight(lightOn,callback,timeoutCallback)
{
    var buffer = Buffer.alloc(3);
    buffer[0] = 0x16;
    buffer[1] = 0x1A;
    if(lightOn)
    {
        buffer[2] = 0xF1;
    }
    else
    {
        buffer[2] = 0xF0;
    }

    addRequest(buffer,noDecode,callback,timeoutCallback)
}


function noDecode(data)
{
    console.log(data);
}

function changeLight()
{
    setLight(document.getElementById("Light").checked,null,null);
}



function changePAS()
{
    setPAS(document.getElementById("PAS").value,null,null);
}
document.getElementById("PAS").addEventListener("change", changePAS);
document.getElementById("Light").addEventListener("change", changeLight);
/*----------------------*/

