var async = require('async');
module.exports = function(Members) {
    Members.remoteMethod('getInfo', {
        http: {
            path: '/getInfo',
            verb: 'GET'
        },
        // notes: "If you pass in the 'requestId' you do not need the other two fields.",
        description: "Handle a request to join an Organizations.",
        accepts: [{
            arg: 'req',
            type: 'object',
            'http': {
                source: 'req'
            }
        }, {
            arg: 'res',
            type: 'object',
            'http': {
                source: 'res'
            }
        }],
        returns: {
            type: 'object',
            root: true
        }
    });
    Members.getInfo = function(req, res, cb) {
        var SSFUsers = Members.app.models.SSFUsers;

        //TODO: check if the user has permissions

        Members.find(req.query.filter, function(err, response) {
            if (err) return cb(err);
            Members.findOne({
                where: {
                    memberId: req.accessToken.userId,
                    orgId: req.query.filter.where.orgId
                }
            }, function(findErr, findRes) {
                if (findErr) return cb(findErr);
                if(!findRes) {
                    var newErr = new Error('You are not already a member.');
                    newErr.statusCode = 503;
                    return cb(newErr);
                }
                async.forEachOf(response, function(index, i, next) {
                        SSFUsers.findOne({
                            where: {
                                id: index.memberId
                            }
                        }, function(memberErr, memberRes) {
                            if (memberErr) {
                                next(memberErr);
                            }
                            else {
                                //any member of the company can see this
                                response[i].firstName = memberRes.firstName;
                                response[i].lastName = memberRes.lastName;

                                //only owners/admins can see this
                                if (findRes.__data.status === 'admin' || findRes.__data.status === 'owner' || memberRes.__data.id.toString() === req.accessToken.userId) {
                                    response[i].email = memberRes.email;
                                    response[i].cellphone = memberRes.cellphone;
                                    // response[i].address = memberRes.address; // ???
                                }
                                next();
                            }
                        });
                    },
                    function(err) {
                        if (err) {
                            var error = new Error('async.forEach operation failed');
                            error.statusCode = 500;
                            cb(error);
                        }
                        cb(0, response);
                    });
            });
        });
    };
};