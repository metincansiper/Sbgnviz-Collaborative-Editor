var derby = require('derby');

exports.run = run;
var model;
var server;
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}
// client names which are currently connected to the server



function run(app, options, cb) {
    options || (options = {});
    var port = options.port || process.env.PORT || 3000 ;//| process.env.OPENSHIFT_NODEJS_PORT ;

    function listenCallback(err) {

        console.log('%d listening. Go to: http://localhost:%d/', process.pid, port);
        cb && cb(err);
    }


    function createServer() {
        var userList = [];


        if (typeof app === 'string') app = require(app);

        require('./server').setup(app, options, function (err, expressApp, upgrade, refModel) {
            model = refModel;





            if (err) throw err;
            server = require('http').createServer(expressApp);



            // var io = require('socket.io')(server);
            var io = require('socket.io').listen(server);

            server.on('upgrade', upgrade);
            server.listen(port, listenCallback);


            //Call this to get profile ids for each cancer study on cBioPortal server
                var cancerDataOrganizer = require('./cancerDataOrganizer.js')();
            //    cancerDataOrganizer.getCancerStudies(); //initialize at the beginning

//            require('./serverSideSocketListener.js').start(io, model, cancerDataOrganizer);
            require('./serverSideSocketListener.js').start(io, model, cancerDataOrganizer);


        });


        return server;


    }

    derby.run(createServer);







}
