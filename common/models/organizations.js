var reqMemship = require('../../custom-apis/organizations/req-memship.js');
var reqHandle = require('../../custom-apis/organizations/req-handle.js');
module.exports = function(Organizations) {
    reqMemship(Organizations);
    reqHandle(Organizations);
    
    
    
};



/*
    Organization.remoteMethod('join', {
        http: {path: '/join', verb: 'POST'},
        accepts: [
            {arg: 'organizationId', type: 'string', description: 'The id that matches the organization you want to join.'},
            {arg: 'userId', type: 'string', description: 'The id for the user requesting to join an organization.'},
        ],
        // notes: "Use this api to join an organization.",
        description: "Request to join an organization.",
        returns: {type: 'object', root: true}
    });
    Organization.join = function(orgId, userId, cb) {
        Organization.findOne({
            where: {
                id: orgId
            }
        });
        cb(0, passedId);
    };*/