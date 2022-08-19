const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');

var Server = function (hostname, port) {
    var _self = this;
    _self._cookieJar = new CookieJar();
    _self._baseurl = 'http://127.0.0.1:8090';

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



    //#endregion

    _self._request = function (url, json, instances, cb, method) {
        var reqjson = { url: _self._baseurl + url.replace('<INSTANCE>', instances) };
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
