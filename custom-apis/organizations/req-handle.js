module.exports = function(Organizations) {
    Organizations.remoteMethod('handleRequest', {
        http: {path: '/handleRequest', verb: 'POST'},
        accepts: [
            {arg: 'requestId', required: true, type: 'string', description: 'The id for the record of the request.'},
            {arg: 'status', required: true, type: 'string', description: 'The status to set the user as within the Organizations.'}
        ],
        // notes: "If you pass in the 'requestId' you do not need the other two fields.",
        description: "Handle a request to join an Organizations.",
        returns: {type: 'object', root: true}
    });
    Organizations.handleRequest = function(requestId, status, cb) {
        var Members = Organizations.app.models.Members;
        Members.findOne({
            where: {
                id: requestId
            }
        }, function(reqFindErr, reqFindRes) {
            if(reqFindErr) {
                cb(reqFindErr);
            } else {
                Members.updateAll({
                    id: requestId
                }, {
                    status: status
                }, function(err, res) {
                    if(err) {
                        cb(err);
                    } else {
                        cb(0, "The member has been set to " + status + ".");
                    }
                });
            }
        });
    };
};