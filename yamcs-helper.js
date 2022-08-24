const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');
const W3CWebSocket = require('websocket').w3cwebsocket;

var Server = function (hostname, port, instance) {
    var _self = this;
    var wsConnection;
    
    _self._cookieJar = new CookieJar();
    _self._baseurl = 'http://127.0.0.1:8090';
    _self.deferredRequests = [];
    _self.subscribers = [];
    _self.mapping = [];

    if (typeof (hostname) !== 'undefined' && typeof (port) !== 'undefined')
        _self._baseurl = 'http://' + hostname + ':' + port;

    /**
     * Login to YAMCS Server - login()
     */
    _self.login = function (username, password, cb) {
        _self._request('/api/login', { username: username, password: password }, null, cb, 'POST');
    };

    /**
     * Logout from YAMCS Server - logout()
     */
    _self.logout = function (cb) {
        _self._request('/api/logout', {}, null, cb, 'POST');
    };
    
    var url = "http://127.0.0.1:8090/api/websocket"
    
    _self.client = new W3CWebSocket(url, ['json']);

    _self.client.onerror = function() {
        console.log('Connect Error');
    };

    _self.client.onopen = function() {
    };
    
    _self.client.onmessage = function(e) {
	    var msg = JSON.parse(e.data);
	    if(msg.type == 'parameters') {
		    if(msg.data !== undefined) {
			    if(msg.data.mapping !== undefined) {
				    for (const [key, value] of Object.entries(msg.data.mapping)) {
				         console.log('Adding mapping ' + key + ':' + value.name + ' to ' + _self.subscribers[value.name]);
					    _self.mapping[parseInt(key)] = _self.subscribers[value.name];
					}
				}
				
			    if(msg.data.values !== undefined) {
				    for(var valIdx = 0; valIdx < msg.data.values.length; ++valIdx) {
					    switch(msg.data.values[valIdx].rawValue.type) {
						    case 'FLOAT':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.floatValue;
						        break;
						    case 'DOUBLE':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.doubleValue;
						        break;
						    case 'SINT32':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.sint32Value;
						        break;
						    case 'UINT32':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.uint32Value;
						        break;
						    case 'BINARY':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.binaryValue;
						        break;
						    case 'STRING':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.stringValue;
						        break;
						    case 'TIMESTAMP':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.timestampValue;
						        break;
						    case 'UINT64':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.uint64Value;
						        break;
						    case 'SINT64':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.sint64Value;
						        break;
						    case 'BOOLEAN':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.booleanValue;
						        break;
						    case 'AGGREGATE':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.aggregateValue;
						        break;
						    case 'ARRAY':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.arrayValue;
						        break;
						    case 'ENUMERATED':
						        msg.data.values[valIdx].rawValue.value = msg.data.values[valIdx].rawValue.stringValue;
						        break;
					    }
					    switch(msg.data.values[valIdx].engValue.type) {
						    case 'FLOAT':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.floatValue;
						        break;
						    case 'DOUBLE':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.doubleValue;
						        break;
						    case 'SINT32':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.sint32Value;
						        break;
						    case 'UINT32':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.uint32Value;
						        break;
						    case 'BINARY':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.binaryValue;
						        break;
						    case 'STRING':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.stringValue;
						        break;
						    case 'TIMESTAMP':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.timestampValue;
						        break;
						    case 'UINT64':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.uint64Value;
						        break;
						    case 'SINT64':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.sint64Value;
						        break;
						    case 'BOOLEAN':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.booleanValue;
						        break;
						    case 'AGGREGATE':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.aggregateValue;
						        break;
						    case 'ARRAY':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.arrayValue;
						        break;
						    case 'ENUMERATED':
						        msg.data.values[valIdx].engValue.value = msg.data.values[valIdx].engValue.stringValue;
						        break;
					    }
					    var subscribers = _self.mapping[msg.data.values[valIdx].numericId];
				        for(var subIdx = 0; subIdx < subscribers.length; ++subIdx) {
					        var callback = subscribers[subIdx];
					        
					        if(typeof callback === 'function') {
						        callback(msg.data.values[valIdx]);
					        }
					    }
				    }
			    }
		    }
	    }	       
	};
	
	_self.client.onopen = function(connection) {
		console.log('connect');
		
		for(var i = 0; i < _self.deferredRequests.length; ++i) {
			_self.SendSubscriptionRequest(_self.deferredRequests[i]['paramName'], _self.deferredRequests[i]['callback']);
		}
	};
	
	_self.SendSubscriptionRequest = function (paramName, callback) {
        var msg = {
	        'type': 'parameters',
	        'call': undefined,
	        'options': {
	            'instance': 'fsw',
	            'processor': 'realtime',
	            'id': [{'name': paramName}]
	        }
	    };
	    
	    if(_self.subscribers[paramName] === undefined) {
		    /* Create a new object */
		    console.log('Creating new subscription for ' + paramName);
		    _self.subscribers[paramName] = [];
	    }
		console.log('Adding subscriber to ' + paramName);
	    _self.subscribers[paramName].push(callback);
	    
        _self.client.send(JSON.stringify(msg));
	};

    _self.SubscribeParameters = function (paramName, callback) {
        if (_self.client.readyState !== _self.client.OPEN) {
		    _self.deferredRequests.push({'paramName': paramName, 'callback': callback});
	    } else {
			_self.SendSubscriptionRequest(_self.deferredRequests[i]['paramName'], callback);
	    }
    };
        
    //#region



    /**
     * List instances
     * ----------
     * calls callback function(err, result) with an array of the instances
     * registered to the YAMCS server
     */
    _self.getInstances = function (cb) {
        _self._request('/api/instances', null, null, cb);
    };

    /**
     * List parameters
     * ----------
     * calls callback function(err, result) with an array of the instances
     * registered to the YAMCS server
     */
    _self.getParameters = function (instance, searchText, continuationToken, cb) {
	    var apiText = '/api/mdb/{instance}/parameters?details=true&searchMembers=true&q=' + searchText;
        var parameters = {};

        if(continuationToken !== null) {
	        apiText += "&next=" + continuationToken;
        }

        _self._request(apiText, null, instance, function(err, result) {
	        parameters = Object.assign(parameters, result);
            if(result.hasOwnProperty('continuationToken')) {
		        _self.getParameters(instance, searchText, result.continuationToken, cb);
	        } else {
		        cb(err, parameters);
	        }
        });
    };



    /**
     * List parameters
     * ----------
     * calls callback function(err, result) with an array of the instances
     * registered to the YAMCS server
     */
    _self.getParameter = function (instance, searchText, continuationToken, cb) {
	    var apiText = '/api/mdb/{instance}/parameters/' & searchText & '?details=true&searchMembers=true';
        var parameters = {};

        if(continuationToken !== null) {
	        apiText += "&next=" + continuationToken;
        }

        _self._request(apiText, null, instance, function(err, result) {
	        parameters = Object.assign(parameters, result);
            if(result.hasOwnProperty('continuationToken')) {
		        _self.getParameters(instance, searchText, result.continuationToken, cb);
	        } else {
		        cb(err, parameters);
	        }
        });
    };

    function isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    //#endregion

    _self._request2 = function (url, json, instance, cb, method) {
        var reqjson = { url: _self._baseurl + url.replace('{instance}', instance) };

        reqjson.CookieJar = _self._cookieJar;
        // identify which request method we are using (GET, POST, DELETE and PUT) 
        if (typeof (method) === 'undefined') {
            reqjson.method = "GET";
        } else {
            reqjson.method = method;
        }
        if (json !== null) {
            reqjson.data = json;
        }
       
        const jar = _self._cookieJar;
        const axiosinstance = axios.create({
            httpAgent: new HttpCookieAgent({ cookies: { jar } }),
            httpsAgent: new HttpsCookieAgent({ cookies: { jar }, rejectUnauthorized: _self._ssl, requestCert: true })
        });

        axiosinstance(reqjson)
            .then(function (response) {
                // handle success
                if (response.headers['x-csrf-token']) {
                    axiosinstance.defaults.headers.common['x-csrf-token'] = response.headers['x-csrf-token'];
                  }
                if (typeof (cb) === 'function') {
                    cb(false, response.data);
                }
            })
            .catch(function (error) {
                // handle error
                if (typeof (cb) === 'function') {
                    cb(true, error.code);
                }
            })
            .then(function () {
                // always executed
            });

    };

};

exports.Server = Server;
