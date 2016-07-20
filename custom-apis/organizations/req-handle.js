module.exports = function(Organizations) {
    Organizations.remoteMethod('handleRequest', {
        http: {
            path: '/handleRequest',
            verb: 'POST'
        },
        accepts: [{
            arg: 'req',
            type: 'object',
            'http': {
                source: 'req'
            }
        }, {
            arg: 'requestId',
            required: true,
            type: 'string',
            description: 'The id for the record of the request.'
        }, {
            arg: 'status',
            required: true,
            type: 'string',
            description: 'The status to set the user as within the Organizations.'
        }],
        // notes: "If you pass in the 'requestId' you do not need the other two fields.",
        description: "Handle a request to join an Organizations.",
        returns: {
            type: 'object',
            root: true
        }
    });
    Organizations.handleRequest = function(req, requestId, status, cb) {
        var Members = Organizations.app.models.Members;
        var userId = req.accessToken.userId;
        //checks if the id requested exists or not
        Members.findOne({
            where: {
                id: requestId
            }
        }, function(reqFindErr, reqFindRes) {
            if (reqFindErr) {
                cb(reqFindErr);
            }
            else {
                //checks the permissions of the token's userId and the
                //requested change orgId to see if the user is allowed
                //to change the status for the specified company
                Members.find({
                    where: {
                        memberId: userId,
                        orgId: reqFindRes.orgId
                    }
                }, function(findTwoErr, findTwoRes) {
                    if (findTwoErr || findTwoRes[0].__data.status !== 'admin' && findTwoRes[0].__data.status !== 'owner') {
                        if(!findTwoErr) {
                            findTwoErr = new Error('You do not have permission to change the status of this request.');
                            findTwoErr.statusCode = 500;
                        }
                        return cb(findTwoErr);
                    }
                    else {
                        Members.updateAll({
                            id: requestId
                        }, {
                            status: status
                        }, function(err, res) {
                            if (err) {
                                cb(err);
                            }
                            else {
                                cb(0, "The member has been set to " + status + ".");
                            }
                        });
                    }
                });
            }
        });
    };
};