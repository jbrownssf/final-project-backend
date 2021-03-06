var async = require('async');
module.exports = function(Members) {
    
// options = {
//     aliases: true,
//     isStatic: true,
//     accepts: [],
//     returns: [],
//     errors: [],
//     description: '',
//     accessType: '??',
//     notes: '',
//     documented: '??',
//     http: '??',
//     rest: '??',
//     shared: '??'
// }
    Members.remoteMethod('getStatuses', {
        http: {path: '/getStatuses', verb: 'GET'},
        // notes: "If you pass in the 'requestId' you do not need the other two fields.",
        description: ".",
        accepts: [
            {arg: 'req', type: 'object', 'http': {source: 'req'}},
            {arg: 'res', type: 'object', 'http': {source: 'res'}}
        ],
        returns: {type: 'object', root: true}
    });
    Members.getStatuses = function(req, res, cb) {
        var Organizations = Members.app.models.Organizations;
        if(req.accessToken.userId !== req.query.filter.where.memberId) {
            var err = new Error('You are not authorized get other people\'s statuses.');
            err.statusCode = 500;
            return cb(err);
        }
        Members.find(req.query.filter, function(err, response) {
            if(err) return cb(err);
            async.forEachOf(response, function(index, i, next) {
                Organizations.findOne({
                    where: {
                        id: index.orgId
                    }
                }, function(orgErr, orgRes) {
                    if(orgErr) {
                        next(orgErr);
                    } else {
                        if(orgRes === null) {
                            orgRes = [];
                        } else {
                            response[i].orgName = orgRes.name;
                        }
                        next();
                    }
                });
            }, function(err) {
            	if(err) {
            		var error = new Error('async.forEach operation failed');
            		error.statusCode = 500;
            		cb(error);
            	}
                cb(0, response);
            });
        });
    };
};