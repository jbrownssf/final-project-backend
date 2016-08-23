var reqJoin = require('../../custom-apis/organizations/req-join.js');
var reqHandle = require('../../custom-apis/organizations/req-handle.js');
var makeOrg = require('../../custom-apis/organizations/make-org.js');


module.exports = function(Organizations) {
    reqJoin(Organizations);
    reqHandle(Organizations);
    makeOrg(Organizations);
};