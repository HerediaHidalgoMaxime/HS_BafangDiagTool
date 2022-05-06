
const { SerialPort } = require('serialport')
const { InterByteTimeoutParser } = require('@serialport/parser-inter-byte-timeout')


/* ---- COM listing ---- */
async function listSerialPorts(portListCallback,errCallback) {
  await SerialPort.list().then((ports, err) => {
    if(err) {
        errCallback(err);
      return
    }

    portListCallback(ports);
  })
}
/* ---------------------- */


/* ----- connection ----- */
var port;
function connection(callback,errCallback,onClose)
{
    port = new SerialPort({ path: com_select.value, baudRate: 1200 }, function (err) {
    if (err) {
        errCallback(err);
        return console.log('Error: ', err.message)
    }
    })
    port.on('open', function() {
        const parser = port.pipe(new InterByteTimeoutParser({ interval: 15 }))
        parser.on('data',function (data) {
            clearTimeout(timeoutObj);
            if(currentRequest.decode != null)
            {
                currentRequest.decode(data);
            }
            if(currentRequest.callback != null)
            {
                currentRequest.callback();
            }
            endRequest();
        })
        callback();
    })
    port.on('error', function(err)
    {
        errCallback(err);
        console.log('Error: ', err.message)
    })
    port.on('close', function (err) {
        console.log('port closed', err);
        onClose();

    });
}
function disconnect()
{
    port.close()
    UpdatingRuntime = false;
}

/* ---------------------- */



/* ---- request management ---- */
var currentRequest = null
var timeoutObj;
var requestBuffer = [];
var requestErrorCallback;


function sendRequest(request)
{
    currentRequest = request;
    if(currentRequest.noAnswer == false)
    {
        timeoutObj = setTimeout(() => {
            console.warn('UART TIMEOUT !!!');
            if(currentRequest.timeoutCallback != null)
            {
                currentRequest.timeoutCallback();
            }
            endRequest();
        }, 1000);
    }
    console.log('data send');
    console.log(request.buffer);
    port.write(request.buffer, function (err, result) {
        if (err) {
            if(currentRequest.errCallback){currentRequest.errCallback(err);}
            console.log('Error while sending message : ' + err);
        }
        if (result) {
            console.log('Response received after sending message : ' + result);

        }
        console.log('sent');
        if(currentRequest.noAnswer == true)
        {
            endRequest();
        }
    });
}

function endRequest()
{
    currentRequest = null;
    if(requestBuffer.length > 0)
    {
        sendRequest(requestBuffer.shift());
    }
}

function addRequest(buffer,decode,callback,timeoutCallback,noAnswer=false,errCallback)
{
    var request = {}
    request.buffer = buffer;
    request.decode = decode;
    request.callback = callback;
    request.timeoutCallback = timeoutCallback;
    request.noAnswer = noAnswer;
    request.errCallback = errCallback;

    if(currentRequest == null)
    {
        if(requestBuffer.length == 0)
        {
            sendRequest(request)
        }
        else
        {
            requestBuffer.push(request);
            sendRequest(requestBuffer.shift());
        }
    }
    else
    {
        requestBuffer.push(request);
    }
}
/* ---------------------------- */


