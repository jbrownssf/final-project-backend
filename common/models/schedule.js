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
                if (memRes.length === 0 || 
                    memRes[0].__data.status === 'pending' || 
                    memRes[0].__data.status === 'declined') {

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
        var History = Schedule.app.models.History;
        var userId = ctx.req.accessToken.userId;
        var didChange = false;
        if (!res.__data.schedule) return cb(new Error('schedule is undefined.'));
        if (typeof res.__data.schedule !== 'object') return cb(new Error('schedule is not an array.'));
        for (var i = res.__data.schedule.length - 1; i >= 0; i--) {
            if (!res.__data.schedule[i]) return cb(new Error('schedule[' + i + '] is undefined.'));
            if (typeof res.__data.schedule[i] !== 'object') return cb(new Error('schedule[' + i + '] is not an array.'));
            for (var j = 1; j < res.__data.schedule[i].length; j++) {
                if (!res.__data.schedule[i][j]) return cb(new Error('schedule[' + i + '][' + j + '] is undefined.'));
                if (typeof res.__data.schedule[i][j] !== 'object') return cb(new Error('schedule[' + i + '][' + j + '] is not an array.'));
                for (var k = res.__data.schedule[i][j].length - 1; k >= 0; k--) {
                    if (!res.__data.schedule[i][j][k]) return cb(new Error('schedule[' + i + '][' + j + '][' + k + '] is undefined.'));
                    if (typeof res.__data.schedule[i][j][k] !== 'object') return cb(new Error('schedule[' + i + '][' + j + '][' + k + '] is not an array.'));
                    if (res.__data.schedule[i][j][k][3] === userId && !res.__data.schedule[i][j][k][4] && res.__data.state !== "saved") {
                        res.__data.schedule[i][j][k][4] = true;
                        didChange = true;
                        History.create({
                            effectedId: res.__data.schedule[i][j][k][3],
                            affectorId: res.__data.schedule[i][j][k][3],
                            relatedOrg: res.__data.groupId,
                            otherInfo: res.__data.id,
                            fromTo: [null, res.__data.schedule[i][j][k], res.__data.id],
                            code: 12,
                            date: new Date()
                        });
                    }
                }
            }
        }
        if (didChange) return updateSched();

        function updateSched() {
            Schedule.upsert(res.__data, function(upsertErr, upsertRes) {
                if (upsertErr) return cb(upsertErr);
                cb();
            });
        }
        cb();
    });

    //should save history for brand new schedules
    Schedule.afterRemote('upsert', function(ctx, nothing, next) {
        var History = Schedule.app.models.History;
        if (!ctx.req.body.id) {
            //new schedule
            var histArr = [];
            if(ctx.args.data.state === 'published') {
                histArr.push({
                    affectorId: ctx.req.accessToken.userId,
                    relatedOrg: ctx.args.data.groupId,
                    fromTo: [null, ctx.args.data.state],
                    code: 11,
                    date: new Date()
                });
            }

            // if(!ctx.args.data.schedule) return next(new Error('schedule is undefined.'));
            // if(typeof ctx.args.data.schedule !== 'object') return next(new Error('schedule is not an array.'));
            for (var i = ctx.args.data.schedule.length - 1; i >= 0; i--) {
                // if(!ctx.args.data.schedule[i]) return next(new Error('schedule[' + i + '] is undefined.'));
                // if(typeof ctx.args.data.schedule[i] !== 'object') return next(new Error('schedule[' + i + '] is not an array.'));
                for (var j = ctx.args.data.schedule[i].length - 1; j > 0; j--) {
                    // if(!ctx.args.data.schedule[i][j]) return next(new Error('schedule[' + i + '][' + j + '] is undefined.'));
                    // if(typeof ctx.args.data.schedule[i][j] !== 'object') return next(new Error('schedule[' + i + '][' + j + '] is not an array.'));
                    for (var k = ctx.args.data.schedule[i][j].length - 1; k >= 0; k--) {
                        // if(!ctx.args.data.schedule[i][j][k]) return next(new Error('schedule[' + i + '][' + j + '][' + k + '] is undefined.'));
                        // if(typeof ctx.args.data.schedule[i][j][k] !== 'object') return next(new Error('schedule[' + i + '][' + j + '][' + k + '] is not an array.'));
                        // if (ctx.args.data.schedule[i][j][k][0] === 'NaN') {
                        //     console.log('deleted', ctx.args.data.schedule[i][j][k]); 
                        //     ctx.args.data.schedule[i][j].splice(k, 1);
                        // }
                        ctx.args.data.schedule[i][j][k].splice(4, 1);
                        histArr.push({ //new spot
                            effectedId: ctx.args.data.schedule[i][j][k][3],
                            affectorId: ctx.req.accessToken.userId,
                            relatedOrg: ctx.args.data.groupId,
                            fromTo: [null, ctx.args.data.schedule[i][j][k], ctx.args.data.id],
                            code: 10,
                            date: new Date()
                        });
                    }
                }
            }

            History.upsert(histArr)
            next();
        }
        else {
            next();
        }
    });

    //should catch "put" methods
    Schedule.beforeRemote('upsert', function(ctx, something, next) {
        var Members = Schedule.app.models.Members;
        var History = Schedule.app.models.History;
        checkMemsUsers(ctx.req.accessToken.userId);

        function finishSchedUpdate(tempArr) {
            History.create(tempArr);
            next();
        }
        
        function handleNewSched() {
            //brand new schedule in here, the hook will catch history to use the schedule's id
            if (!ctx.args.data.schedule) return next(new Error('schedule is undefined.'));
            if (typeof ctx.args.data.schedule !== 'object') return next(new Error('schedule is not an array.'));
            for (var i = ctx.args.data.schedule.length - 1; i >= 0; i--) {
                if (!ctx.args.data.schedule[i]) return next(new Error('schedule[' + i + '] is undefined.'));
                if (typeof ctx.args.data.schedule[i] !== 'object') return next(new Error('schedule[' + i + '] is not an array.'));
                if (ctx.args.data.schedule[i][0] === 'NaN') {
                    ctx.args.data.schedule.splice(i, 1);
                }
                else {
                    for (var j = ctx.args.data.schedule[i].length - 1; j > 0; j--) {
                        if (!ctx.args.data.schedule[i][j]) return next(new Error('schedule[' + i + '][' + j + '] is undefined.'));
                        if (typeof ctx.args.data.schedule[i][j] !== 'object') return next(new Error('schedule[' + i + '][' + j + '] is not an array.'));
                        for (var k = ctx.args.data.schedule[i][j].length - 1; k >= 0; k--) {
                            if (!ctx.args.data.schedule[i][j][k]) return next(new Error('schedule[' + i + '][' + j + '][' + k + '] is undefined.'));
                            if (typeof ctx.args.data.schedule[i][j][k] !== 'object') return next(new Error('schedule[' + i + '][' + j + '][' + k + '] is not an array.'));
                            if (ctx.args.data.schedule[i][j][k][0] === 'NaN') {
                                ctx.args.data.schedule[i][j].splice(k, 1);
                            }
                            else {
                                ctx.args.data.schedule[i][j][k].splice(4, 1);
                            }
                        }
                    }
                }
            }
            next();
        }

        function checkMemsUsers(userId) {
            Members.find({
                "where": {
                    "memberId": userId,
                    "orgId": ctx.args.data.groupId
                }
            }, function(memErr, memRes) {
                if (memErr)
                    return next(memErr);
                //TODO: History codes, 7, 8, 9, 10, and 11
                var historyArr = [];
                if (memRes.length === 0 || (memRes[0].__data.status !== 'admin' && memRes[0].__data.status !== 'owner')) {
                    var err = new Error("Unauthorized to perform this action");
                    err.status = 401;
                    next(err);
                }
                else if (!ctx.args.data.id) {
                    return handleNewSched();
                }
                else {
                    Schedule.findOne({
                        where: {
                            id: ctx.args.data.id
                        }
                    }, function(findErr, findRes) {
                        if (findErr) next(findErr);
                        if(!findRes) {
                            delete ctx.args.data.id;
                            return handleNewSched();
                        }
                        if (findRes.__data.state !== ctx.args.data.state) {
                            //state changed on schedule
                            if(findRes.__data.state === 'published' && ctx.args.data.state === 'saved') 
                                return new Error('You cannot unpublish a schedule once it\'s been published.');
                            historyArr.push({
                                affectorId: userId,
                                relatedOrg: ctx.args.data.groupId,
                                fromTo: [
                                    ctx.args.data.state === 'published' ? null : findRes.__data.state,
                                    ctx.args.data.state,
                                    ctx.args.data.id
                                ],
                                code: 11,
                                date: new Date()
                            });
                        }
                        if (findRes.__data.assignedDate.toString() !== new Date(ctx.args.data.assignedDate).toString()) {
                            //assignedDate changed on schedule
                            historyArr.push({
                                affectorId: userId,
                                relatedOrg: ctx.args.data.groupId,
                                fromTo: [findRes.__data.assignedDate, ctx.args.data.assignedDate, ctx.args.data.id],
                                code: 9,
                                date: new Date()
                            });
                        }
                        if (findRes.__data.note !== ctx.args.data.note) {
                            //note changed on schedule
                            historyArr.push({
                                affectorId: userId,
                                relatedOrg: ctx.args.data.groupId,
                                fromTo: [findRes.__data.note, ctx.args.data.note, ctx.args.data.id],
                                code: 14,
                                date: new Date()
                            });
                        }
                        if (!ctx.args.data.schedule) return next(new Error('schedule is undefined.'));
                        if (typeof ctx.args.data.schedule !== 'object') return next(new Error('schedule is not an array.'));
                        for (var i = ctx.args.data.schedule.length - 1; i >= 0; i--) {
                            if (!ctx.args.data.schedule[i]) return next(new Error('schedule[' + i + '] is undefined.'));
                            if (typeof ctx.args.data.schedule[i] !== 'object') return next(new Error('schedule[' + i + '] is not an array.'));
                            if (ctx.args.data.state === 'deleted' || ctx.args.data.schedule[i][0] === 'NaN') {
                                //deleted section
                                historyArr.push({
                                    affectorId: userId,
                                    relatedOrg: ctx.args.data.groupId,
                                    fromTo: [findRes.__data.schedule[i][0], null, ctx.args.data.id],
                                    code: 13,
                                    date: new Date()
                                });
                                for (var a = findRes.__data.schedule[i].length - 1; a > 0; a--) {
                                    if (!findRes.__data.schedule[i][a]) return next(new Error('schedule[' + i + '][' + a + '] is undefined.'));
                                    if (typeof findRes.__data.schedule[i][a] !== 'object') return next(new Error('schedule[' + i + '][' + a + '] is not an array.'));
                                    for (var b = findRes.__data.schedule[i][a].length - 1; b >= 0; b--) {
                                        //spot removed from schedule
                                        historyArr.push({
                                            effectedId: findRes.__data.schedule[i][a][b][3],
                                            affectorId: userId,
                                            relatedOrg: ctx.args.data.groupId,
                                            fromTo: [findRes.__data.schedule[i][a][b], null, ctx.args.data.id],
                                            code: 10,
                                            date: new Date()
                                        });
                                    }
                                }
                                ctx.args.data.schedule.splice(i, 1);
                            }
                            else {
                                if (findRes.__data.schedule && findRes.__data.schedule[i]) {
                                    if (findRes.__data.schedule[i][0] !== ctx.args.data.schedule[i][0]) {
                                        //section name changed on schedule
                                        historyArr.push({
                                            affectorId: userId,
                                            relatedOrg: ctx.args.data.groupId,
                                            fromTo: [
                                                (findRes.__data.schedule && findRes.__data.schedule[i] && findRes.__data.schedule[i][0] ? findRes.__data.schedule[i][0] : null),
                                                ctx.args.data.schedule[i][0],
                                                ctx.args.data.id
                                            ],
                                            code: 13,
                                            date: new Date()
                                        });
                                    }
                                }
                                else {
                                    historyArr.push({
                                        affectorId: userId,
                                        relatedOrg: ctx.args.data.groupId,
                                        fromTo: [
                                            null,
                                            ctx.args.data.schedule[i][0],
                                            ctx.args.data.id
                                        ],
                                        code: 13,
                                        date: new Date()
                                    });
                                    //new section
                                }
                                var hasChanged;
                                for (var a = ctx.args.data.schedule[i].length - 1; a > 0; a--) {
                                    if (ctx.args.data.schedule[i][a]) {
                                        for (var b = ctx.args.data.schedule[i][a].length - 1; b >= 0; b--) {
                                            if (!ctx.args.data.schedule[i][a][b]) return next(new Error('schedule[' + i + '][' + a + '][' + b + '] is undefined.'));
                                            if (ctx.args.data.state === 'deleted' || ctx.args.data.schedule[i][a][b][0] === 'NaN') {
                                                //original spot
                                                if (findRes.__data.schedule && findRes.__data.schedule[i] && findRes.__data.schedule[i][a] && findRes.__data.schedule[i][a][b] && findRes.__data.schedule[i][a][b][3]) {
                                                    historyArr.push({
                                                        effectedId: findRes.__data.schedule[i][a][b][3],
                                                        affectorId: userId,
                                                        relatedOrg: ctx.args.data.groupId,
                                                        fromTo: [
                                                            findRes.__data.schedule[i][a][b],
                                                            null,
                                                            ctx.args.data.id
                                                        ],
                                                        code: 10,
                                                        date: new Date()
                                                    });
                                                }
                                                ctx.args.data.schedule[i][a].splice(b, 1);
                                            }
                                            else {
                                                hasChanged = 0;
                                                if (findRes.__data.schedule && findRes.__data.schedule[i] && findRes.__data.schedule[i][a] && findRes.__data.schedule[i][a][b]) {
                                                    if (findRes.__data.schedule[i][a][b][0] !== ctx.args.data.schedule[i][a][b][0]) hasChanged = 1;
                                                    if (findRes.__data.schedule[i][a][b][1] !== ctx.args.data.schedule[i][a][b][1]) hasChanged = 1;
                                                    if (findRes.__data.schedule[i][a][b][2] !== ctx.args.data.schedule[i][a][b][2]) hasChanged = 1;
                                                    if (findRes.__data.schedule[i][a][b][3] !== ctx.args.data.schedule[i][a][b][3]) hasChanged = 2;
                                                    if (!hasChanged && findRes.__data.schedule[i][a][b][4] !== ctx.args.data.schedule[i][a][b][4]) ctx.args.data.schedule[i][a][b][4] = true;
                                                    if (hasChanged == 1) {
                                                        //spot was altered
                                                        historyArr.push({ //original spot
                                                            effectedId: findRes.__data.schedule[i][a][b][3],
                                                            affectorId: userId,
                                                            relatedOrg: ctx.args.data.groupId,
                                                            fromTo: [findRes.__data.schedule[i][a][b], ctx.args.data.schedule[i][a][b], ctx.args.data.id],
                                                            code: 10,
                                                            date: new Date()
                                                        });
                                                        historyArr.push({ //new spot
                                                            effectedId: ctx.args.data.schedule[i][a][b][3],
                                                            affectorId: userId,
                                                            relatedOrg: ctx.args.data.groupId,
                                                            fromTo: [findRes.__data.schedule[i][a][b], ctx.args.data.schedule[i][a][b], ctx.args.data.id],
                                                            code: 10,
                                                            date: new Date()
                                                        });
                                                    } else if(hasChanged === 2) {
                                                        //spot was changed to a new person
                                                        historyArr.push({ //original person
                                                            effectedId: findRes.__data.schedule[i][a][b][3],
                                                            affectorId: userId,
                                                            relatedOrg: ctx.args.data.groupId,
                                                            fromTo: [findRes.__data.schedule[i][a][b], null, ctx.args.data.id],
                                                            code: 10,
                                                            date: new Date()
                                                        });
                                                        historyArr.push({ //new person
                                                            effectedId: ctx.args.data.schedule[i][a][b][3],
                                                            affectorId: userId,
                                                            relatedOrg: ctx.args.data.groupId,
                                                            fromTo: [null, ctx.args.data.schedule[i][a][b], ctx.args.data.id],
                                                            code: 10,
                                                            date: new Date()
                                                        });
                                                        
                                                    }
                                                }
                                                else {
                                                    historyArr.push({ //new spot
                                                        effectedId: ctx.args.data.schedule[i][a][b][3],
                                                        affectorId: userId,
                                                        relatedOrg: ctx.args.data.groupId,
                                                        fromTo: [null, ctx.args.data.schedule[i][a][b], ctx.args.data.id],
                                                        code: 10,
                                                        date: new Date()
                                                    });

                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (ctx.args.data.schedule.length === 0) {
                            ctx.args.data.schedule = [
                                ['Removed']
                            ];
                            // historyArr.push({
                            //     affectorId: userId,
                            //     relatedOrg: ctx.args.data.groupId,
                            //     fromTo: [ctx.args.data.state, 'deleted', ctx.args.data.id],
                            //     code: 11,
                            //     date: new Date()
                            // });
                            ctx.args.data.state = 'deleted';
                        }
                        finishSchedUpdate(historyArr);
                    });
                }
            });
        }
    });
};
