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

    Members.remoteMethod('getRequests', {
        http: {path: '/getRequests', verb: 'GET'},
        description: "Handle a request to join an Organizations.",
        accepts: [
            {arg: 'req', type: 'object', 'http': {source: 'req'}},
            {arg: 'res', type: 'object', 'http': {source: 'res'}}
        ],
        returns: {type: 'object', root: true}
    });
    
    Members.getRequests = function(req, res, cb) {
        var SSFUsers = Members.app.models.SSFUsers;
        Members.find(req.query.filter, function(err, response) {
            if(err) return cb(err);
            async.forEachOf(response, function(index, i, next) {
                SSFUsers.findOne({
                    where: {
                        id: index.memberId
                    }
                }, function(memberErr, memberRes) {
                    if(memberErr) {
                        next(memberErr);
                    } else {
                        response[i].orgName = memberRes.name;
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