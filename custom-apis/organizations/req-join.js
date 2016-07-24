module.exports = function(Organization) {
    Organization.remoteMethod('join', {
        accepts: [
            {arg: 'req', type: 'object', 'http': {source: 'req'}},
            {arg: "userId", required: true, type: "string", description: "The user's ID who wants to join an organization."},
            {arg: "organizationId", required: true, type: "string", description: "The organization's ID that the user wants to join."},
            {arg: "nickName", type: "string", description: "The organization's ID that the user wants to join."},
        ],
        http: {path: '/join', verb: "POST"},
        returns: {type: 'object', root: true}
    });
    Organization.join = function(req, userId, orgId, nickName, callback) {
        var Members = Organization.app.models.Members;
        var History = Organization.app.models.History;
        Organization.findOne({
            where: {
                id: orgId
            }
        }, function(err, success) {
            if(err) {
                var error = new Error('Something went wrong in finding the organization by the id of ' + orgId);
                error.statusCode = 500;
                return callback(error);
            } else if(success.status === "open") {
                //user can join without being invited
                var newMembers = {
                    memberId: userId,
                    status: "pending",
                    orgId: orgId
                };
                Members.findOne({
                    where: {
                        memberId: userId,
                        orgId: orgId
                    }
                }, function(findMemErr, findMemRes) {
                    if(findMemErr) {
                        var error = new Error("There was a problem finding the user");
                        error.statusCode = 503;
                        callback(error);
                    } else {
                        if(!findMemRes) {
                            History.create({
                                effectedId: userId,
                                affectorId: req.accessToken.userId,
                                relatedOrg: orgId,
                                fromTo: [
                                    null,
                                    'pending'
                                ],
                                code: 5,
                                date: new Date()
                            });
                        }
                        History.create({
                            affectorId: req.accessToken.userId,
                            relatedOrg: orgId,
                            fromTo: [
                                !findMemRes ? null : findMemRes.nickName,
                                nickName
                            ],
                            code: 4,
                            date: new Date()
                        });
                        if(findMemRes) {
                            newMembers = findMemRes.__data;
                            newMembers.nickName = nickName;
                        }
                        Members.upsert(newMembers, function(addMemErr, addMemRes) {
                            if(addMemErr) {
                                var error = new Error('Cannot add ' + userId + ' to ' + orgId);
                                error.statusCode = 503;
                                return callback(error);
                            }
                            callback(0, addMemRes.__data);
                        });
                        // callback(0, findMemRes);
                    }
                });
            } else {
                var error = new Error('Cannot add ' + userId + ' to ' + orgId + ' because the specified organization is set to ' + success.status);
                error.statusCode = 503;
                return callback(error);
            }
        });
    };
};