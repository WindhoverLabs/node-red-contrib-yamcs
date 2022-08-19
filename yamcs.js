module.exports = function (RED) {

    'use strict';

    const STATUS_OK = {
        fill: "green",
        shape: "dot",
        text: "OK"
    };

    const yamcs = require('./yamcs-helper.js');

    function YamcsNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        var nodeServer =  RED.nodes.getNode(config.server);
        if(!nodeServer) {
            this.error(RED._('missing client config'));
            return;
        }

        let {username, password, instance, ip, port} = nodeServer;
        let {command} = config;

        const server = new yamcs.Server(ip, port);

        this.on('input', function (msg) {

            if (msg.payload.command != null) {
                command = msg.payload.command;
            } else {
                command = config.command;
            }

            if (msg.payload.instance != null) {
                instance = msg.payload.instance;
            } else {
                instance = nodeServer.instance;
            }

            
            //server.login(username, password, (err, data) => {

            //    if (err) {
            //        console.log('ERROR: ' + data);
            //        node.status({
            //            fill: "red",
            //            shape: "dot",
            //            text: data
            //        });
            //        return;
            //    }

                

                switch(command.toString().toLowerCase()){
                    case '1':
                    case 'getinstances':
                        server.getInstances(handleDataCallback);
                        break;
                    default:
                        //server.logout();
                        node.status({
                            fill: "red",
                            shape: "dot",
                            text: "No command"
                        });
                        break;
                }

            //});

            function handleDataCallback(err, data) {
                if (err) {
                    console.log('ERROR: ' + err.message);
                    msg.error = err.message;
                    node.send(msg);
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: err.message
                    });
    
                } else {
                    //server.logout();
                    msg.payload = data;
                    node.send(msg);
                    node.status(STATUS_OK);
                }
            }
        });
    }

    function yamcsConfigNode(n) {
        RED.nodes.createNode(this,n);

        this.name = n.name;
        this.ip = n.ip;
        this.port = n.port;
        this.instance = n.instance;
        this.username = this.credentials.username;
        this.password = this.credentials.password;
    }
    
    RED.nodes.registerType("yamcsconfig", yamcsConfigNode,{
        credentials: {
            username: {type:"text"},
            password: {type:"password"}
        }
    });

    RED.nodes.registerType("YAMCS", YamcsNode);
};
