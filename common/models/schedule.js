module.exports = function(Schedule) {
    //User can only get it's own inputs
    Schedule.beforeRemote('find', function(context, instance, next) {
        var Members = Schedule.app.models.Members;
        checkMemsUsers(context.req.accessToken.userId);
        function checkMemsUsers(userId) {
            Members.find({"where":{"memberId": userId, "orgId": context.args.filter.where.groupId}}, function(memErr, memRes) {
                if(memErr)
                    return next(memErr);
                if(memRes.length === 0 || memRes[0].__data.status === 'pending' || memRes[0].__data.status === 'declined') {
                    var err = new Error("Unauthorized to perform this action");
                    err.status = 401;
                    next(err);
                } else {
                    next();
                }
            });
        }
    });
    
    //User can only get it's own inputs
    Schedule.beforeRemote('findOne', function(context, instance, next) {
        var Members = Schedule.app.models.Members;
        checkMemsUsers(context.req.accessToken.userId);
        function checkMemsUsers(userId) {
            Members.find({"where":{"memberId": userId, "orgId": context.args.filter.where.groupId}}, function(memErr, memRes) {
                if(memErr)
                    return next(memErr);
                if(memRes.length === 0 || memRes[0].__data.status === 'pending' || memRes[0].__data.status === 'declined') {
                    var err = new Error("Unauthorized to perform this action");
                    err.status = 401;
                    next(err);
                } else {
                    next();
                }
            });
        }
    });
    
    //should catch "put" methods
    Schedule.beforeRemote('upsert', function(ctx, something, next) {
        var Members = Schedule.app.models.Members;
        checkMemsUsers(ctx.req.accessToken.userId);
        function checkMemsUsers(userId) {
            Members.find({"where":{"memberId": userId, "orgId": ctx.args.data.groupId}}, function(memErr, memRes) {
                if(memErr)
                    return next(memErr);
                if(memRes.length === 0 || (memRes[0].__data.status !== 'admin' && memRes[0].__data.status !== 'owner')) {
                    var err = new Error("Unauthorized to perform this action");
                    err.status = 401;
                    next(err);
                } else {
                    next();
                }
            });
        }
    });
};
