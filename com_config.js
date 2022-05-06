

/* --------- init --------- */
function sendInit(callback,timeoutCallback)
{
    var buffer = Buffer.alloc(5);
    buffer[0] = 0x11;
    buffer[1] = 0x51;
    buffer[2] = 0x04;
    buffer[3] = 0xB0;
    buffer[4] = 0x05;
    addRequest(buffer,generalDecode,callback,timeoutCallback)
}

var Bafang = {};
Bafang.General = {};
function generalDecode(data)
{
    console.log(data);
    Bafang.General.Manufacturer = new TextDecoder().decode(data.subarray(4,6));
    Bafang.General.Model = new TextDecoder().decode(data.subarray(6,10));
    Bafang.General.HW = new TextDecoder().decode(data.subarray(10,12));
    Bafang.General.FW = new TextDecoder().decode(data.subarray(12,16));

    switch(data[16])
    {
        case 0:
            Bafang.General.NominalVoltage = "24V"
            break;
        case 1:
            Bafang.General.NominalVoltage = "36V"
            break;
        case 2:
            Bafang.General.NominalVoltage = "48V"
            break;
        case 3:
            Bafang.General.NominalVoltage = "60V"
            break;
        case 4:
            Bafang.General.NominalVoltage = "24-48V"
            break;
        default:
            Bafang.General.NominalVoltage = "24-60V"
            break;
    }

    Bafang.General.MaxCurrent = data[17] + "A"
    document.getElementById("ControlerVersion").innerHTML = tableify(Bafang.General);
}
/*-------------------------------------------*/



/*------------------- get config -------------*/
function getThrottleInfo(callback,timeoutCallback)
{
    var buffer = Buffer.alloc(2);
    buffer[0] = 0x11;
    buffer[1] = 0x54;
    addRequest(buffer,throttleDecode,callback,timeoutCallback)
}

Bafang.ThrottleInfo = {};
function throttleDecode(data)
{
    console.log(data);

    Bafang.ThrottleInfo.startVoltage = (data[2]/10)+"V";
    Bafang.ThrottleInfo.endVoltage = (data[3]/10)+"V";
    var mode = data[4];
    switch(mode)
    {
        case 1:
            Bafang.ThrottleInfo.mode = "Current";
            break;
        case 0:
            Bafang.ThrottleInfo.mode = "Speed";
            break;
    }

    if( data[5] == 255 )
    {
        Bafang.ThrottleInfo.AssistLevel = "Display";
    }
    else
    {
        Bafang.ThrottleInfo.AssistLevel = data[5] + 1;
    }

    if( data[6] == 255 )
    {
        Bafang.ThrottleInfo.SpeedLimit = "Display";
    }
    else
    {
        Bafang.ThrottleInfo.SpeedLimit = (data[6]) + "km/h";
    }
    Bafang.ThrottleInfo.StartCurrent = data[7] + "%";

    document.getElementById("ThrottleInfo").innerHTML = tableify(Bafang.ThrottleInfo);

}

function getBasicSettings(callback,timeoutCallback)
{
    var buffer = Buffer.alloc(2);
    buffer[0] = 0x11;
    buffer[1] = 0x52;
    addRequest(buffer,basicSettingsDecode,callback,timeoutCallback)
}
Bafang.BasicSettings = {};
function basicSettingsDecode(data)
{
    console.log(data);

    Bafang.BasicSettings.LowBatteryProtection = data[2] + "V";
    Bafang.BasicSettings.CurrentLimitation = data[3] + "A" ;
    Bafang.BasicSettings.AssitCurrentLimitation = [];
    for(idx=4;idx<=13;idx++)
    {
        Bafang.BasicSettings.AssitCurrentLimitation.push((data[idx])+"%");
    }

    Bafang.BasicSettings.AssitSpeedLimitation = [];
    for(idx=14;idx<=23;idx++)
    {
        Bafang.BasicSettings.AssitSpeedLimitation.push(data[idx]+"%");
    }

    Bafang.BasicSettings.WheelSize = data[24]/2 + "Inch";
    Bafang.BasicSettings.WheelSize_val = data[24]/2;

    var speedmetertype = (data[25]>>6);
    switch(speedmetertype)
    {
        case 3:
            Bafang.BasicSettings.SpeedMeterType = "By Motor Phase";
            break;
        case 2:
            Bafang.BasicSettings.SpeedMeterType = "By Motor Phase";
            break;
        case 1:
            Bafang.BasicSettings.SpeedMeterType = "Internal, Motor Meter";
            break;
        case 0:
            Bafang.BasicSettings.SpeedMeterType = "External, Wheel Meter";
            break;
    }

    Bafang.BasicSettings.SpeedMeterSignal = (data[25]&0x3F);

    document.getElementById("BasicSettings").innerHTML = tableify(Bafang.BasicSettings);
}

function getPedalAssistSettings(callback,timeoutCallback)
{
    var buffer = Buffer.alloc(2);
    buffer[0] = 0x11;
    buffer[1] = 0x53;
    addRequest(buffer,pedalAssistSettingsDecode,callback,timeoutCallback)
}
Bafang.PedalAssistSettings = {};
function pedalAssistSettingsDecode(data)
{
    console.log(data);

    var SensorType = (data[2]);
    switch(SensorType)
    {
        case 3:
            Bafang.PedalAssistSettings.SensorType = "Double signal 24";
            break;
        case 2:
            Bafang.PedalAssistSettings.SensorType = "DH sensor 12";
            break;
        case 1:
            Bafang.PedalAssistSettings.SensorType = "BB sensor 32";
            break;
        case 0:
            Bafang.PedalAssistSettings.SensorType = "None";
            break;
    }

    if(data[3] == 255)
    {
        Bafang.PedalAssistSettings.DesignatedAssistLevel = "Display";
    }
    else
    {
        Bafang.PedalAssistSettings.DesignatedAssistLevel = data[3];
    }

    if(data[4] == 255)
    {
        Bafang.PedalAssistSettings.SpeedLimit = "Display";
    }
    else
    {
        Bafang.PedalAssistSettings.SpeedLimit = data[4] + "km/h";
    }

    Bafang.PedalAssistSettings.StartCurrent = data[5] + "%";
    Bafang.PedalAssistSettings.SlowStartMode = data[6];
    Bafang.PedalAssistSettings.StartAngle = ((data[7]/24)*360)+ "°";

    if(data[8] == 255)
    {
        Bafang.PedalAssistSettings.WorkMode = "unknown";
    }
    else
    {
        Bafang.PedalAssistSettings.WorkMode = data[8];
    }


    Bafang.PedalAssistSettings.StopDelay = (data[9]*10) + "ms" ;
    Bafang.PedalAssistSettings.CurrentDecay = data[10];
    Bafang.PedalAssistSettings.StopDecay = (data[11]*10) + "ms";
    Bafang.PedalAssistSettings.KeepCurrent = data[12] + "%";

    document.getElementById("PedalAssistSettings").innerHTML = tableify(Bafang.PedalAssistSettings);
}

/* --------------------------------------- */