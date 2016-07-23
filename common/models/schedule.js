module.exports = function(Schedule) {
    //User can only get it's own inputs
    Schedule.beforeRemote('find', function(context, instance, next) {
        var Members = Schedule.app.models.Members;
        checkMemsUsers(context.req.accessToken.userId);

        function checkMemsUsers(userId) {
            Members.find({
                "where": {
                    "memberId": userId,
                    "orgId": context.args.filter.where.groupId
                }
            }, function(memErr, memRes) {
                if (memErr)
                    return next(memErr);
                if (memRes.length === 0 || memRes[0].__data.status === 'pending' || memRes[0].__data.status === 'declined') {
                    var err = new Error("Unauthorized to perform this action");
                    err.status = 401;
                    next(err);
                }
                else {
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
            Members.find({
                "where": {
                    "memberId": userId,
                    "orgId": context.args.filter.where.groupId
                }
            }, function(memErr, memRes) {
                if (memErr)
                    return next(memErr);
                if (memRes.length === 0 || memRes[0].__data.status === 'pending' || memRes[0].__data.status === 'declined') {
                    var err = new Error("Unauthorized to perform this action");
                    err.status = 401;
                    next(err);
                }
                else {
                    next();
                }
            });
        }
    });

    Schedule.afterRemote('findOne', function(ctx, res, cb) {
        var userId = ctx.req.accessToken.userId;
        var didChange = false;
        for (var i in res.__data.schedule) {
            for (var j = 1; j < res.__data.schedule[i].length; j++) {
                for (var k in res.__data.schedule[i][j]) {
                    if (res.__data.schedule[i][j][k][3] === userId && !res.__data.schedule[i][j][k][4]) {
                        res.__data.schedule[i][j][k][4] = true;
                        didChange = true;
                    }
                }
            }
        }
        if(didChange) return updateSched();
        function updateSched() {
            Schedule.upsert(res.__data, function(upsertErr, upsertRes) {
                if(upsertErr) return cb(upsertErr);
                cb();
            });
        }
        cb();
    });

    //should catch "put" methods
    Schedule.beforeRemote('upsert', function(ctx, something, next) {
        var Members = Schedule.app.models.Members;
        checkMemsUsers(ctx.req.accessToken.userId);

        function checkMemsUsers(userId) {
            Members.find({
                "where": {
                    "memberId": userId,
                    "orgId": ctx.args.data.groupId
                }
            }, function(memErr, memRes) {
                if (memErr)
                    return next(memErr);
                if (memRes.length === 0 || (memRes[0].__data.status !== 'admin' && memRes[0].__data.status !== 'owner')) {
                    var err = new Error("Unauthorized to perform this action");
                    err.status = 401;
                    next(err);
                }
                else {
                    next();
                }
            });
        }
    });
};
