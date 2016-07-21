var reqJoin = require('../../custom-apis/organizations/req-join.js');
var reqHandle = require('../../custom-apis/organizations/req-handle.js');
var makeOrg = require('../../custom-apis/organizations/make-org.js');
module.exports = function(Organizations) {
    reqJoin(Organizations);
    reqHandle(Organizations);
    makeOrg(Organizations);
    
    //User can only get it's own inputs
    // Organizations.beforeRemote('join', function(context, instance, next) {
    //     var Members = Organizations.app.models.Members;
    //     checkMemsUsers(context.req.accessToken.userId);
    //     function checkMemsUsers(userId) {
    //         Members.find({"where":{"memberId": userId, "orgId": context.args.filter.where.groupId}}, function(memErr, memRes) {
    //             if(memErr)
    //                 return next(memErr);
    //             if(memRes.length === 0 || memRes[0].__data.status === 'pending' || memRes[0].__data.status === 'declined') {
    //                 var err = new Error("Unauthorized to perform this action");
    //                 err.status = 401;
    //                 next(err);
    //             } else {
    //                 next();
    //             }
    //         });
    //     }
    // });
    
    
    
};