module.exports = function(Schedule) {
    //User can only get it's own inputs
    
    
    //Checks if the schedule is a valid format
    function checkValidity(input, callback) {
        var entireSched = input;
        for(var i = 0; i < entireSched.length; i++) {
            var section = entireSched[i];
            if(section && section.constructor !== Array) {
                callback(new Error("The schedule sections area is not an array. Error occured on index '" + i  + "' of the property 'schedule'."));
            } else if(typeof section[0] !== "string") {
                callback(new Error("The area name '" + section[0] + "' is either not a string or undefined. Error occured within index '" + i  + "' on index '0' of the property 'schedule'."));
            }
            for(var j = 0; j < section[1].length; j++) {
                var spot = section[1][j]; //is the individual spot of each section
                if(section[0] === 'null' || spot[0] === 'null') {
                    //going to be deleted anyways, so ignore
                } else if(typeof spot[0] !== "string" && spot[0]) {
                    callback(new Error("The location name '" + spot[0] + "' is either not a string or undefined. Error occured within index '1' within index '" + i  + "' within index '" + j + "' on index '" + 0 + "' of the property 'schedule'."));
                } else if(spot[1] && isNaN(new Date(spot[1]))) {
                    //the date property exists and is not a date 
                    callback(new Error("The date '" + spot[1] + "' is not a valid date. Error occured within index '" + i  + "' within index '1' within index '" + j + "' within index '" + 1 + "' of the property 'schedule'."));
                } else if(spot[2] && isNaN(new Date(spot[2]))) {
                    //the date property exists and is not a date 
                    callback(new Error("The date '" + spot[2] + "' is not a valid date. Error occured within index '" + i  + "' within index '1' within index '" + j + "' within index '" + 2 + "' of the property 'schedule'."));
                } else if(spot[3] && typeof spot[3] !== "string") {
                    //the userId exists and is not a string
                    callback(new Error("The userId '" + spot[3] + "' is not a valid string. Error occured within index '" + i  + "' within index '1' within index '" + j + "' on index '" + 3 + "' of the property 'schedule'."));
                }
            }
        }
        callback();
    }
    
    
    //Checks if the member making the request is a part of the company
    //they are requesting information on
    function checkMemsUsers(minStatus, filter, callback) {
        //valid minStatus values:
            //owner
            //admin
            //member
            //none
        var Members = Schedule.app.models.Members;
        Members.findOne(filter, function(memErr, memRes) {
            if (memErr) {
                callback(memErr);
            } else if(minStatus === "none") {
                callback();
            } else if(minStatus === "member" && memRes.status === "member" || memRes.status === "admin" || memRes.status === "owner") {
                callback();
            } else if(minStatus === "admin" && memRes.status === "admin" || memRes.status === "owner") {
                callback();
            } else if(minStatus === "owner" && memRes.status === "owner") {
                callback();
            } else {
                callback(new Error("You do not have '" + minStatus + "' permissions to make this request."));
            }
        });
    }
    
    
    //whenever a schedule is updated this should be called
    function trackChanges(params, callback) {
        var historyArr = [];
        var newSched = params.newSched;
        var oldSched = params.oldSched;
        var userId = params.userId;
        
        //checks that groupId matches
        if(newSched.groupId !== oldSched.groupId) return callback(new Error("You cannot change which group a schedule is for once it has been created."));
        //cannot unpublish a schedule. This catches that case
        if (oldSched.state === 'published' && newSched.state === 'saved')
            return callback(new Error('You cannot unpublish a schedule once it\'s been published.'));
        //Compares the states of the two schedules for a change
        if (oldSched.state !== newSched.state) {
            historyArr.push({
                affectorId: params.userId,
                relatedOrg: newSched.groupId,
                fromTo: [
                    newSched.state === 'published' ? null : oldSched.state,
                    newSched.state,
                    newSched.id
                ],
                code: 11,
                date: new Date()
            });
        }
        //Checks for a change in the assignedDate field
        if (oldSched.assignedDate.toString() !== new Date(newSched.assignedDate).toString()) {
            historyArr.push({
                affectorId: params.userId,
                relatedOrg: newSched.groupId,
                fromTo: [oldSched.assignedDate, newSched.assignedDate, newSched.id],
                code: 9,
                date: new Date()
            });
        }
        //Checks for a change in the notes
        if (oldSched.note !== newSched.note) {
            historyArr.push({
                affectorId: params.userId,
                relatedOrg: newSched.groupId,
                fromTo: [oldSched.note, newSched.note, newSched.id],
                code: 14,
                date: new Date()
            });
        }
        
        
        //loops through the schedule
        for(var i = newSched.schedule.length - 1; i >= 0; i--) {
            var newSection = newSched.schedule[i];
            var oldSection = oldSched.schedule && oldSched.schedule[i];
            var j;
            if(!oldSection || !oldSection[1] || newSection[1].length >= oldSection[1].length) {
                j = newSection[1].length - 1;
            } else {
                j = oldSection[1].length - 1;
            }
            for(j; j >= 0; j--) {
                var newSpot = newSection[1][j];
                var oldSpot = oldSection && oldSection[1] && oldSection[1][j];
                //spot removed from schedule
                //TODO: if state: 'deleted', section: 'NaN', or spot: 'NaN'
                    //if old spot is undefined and it's deleted. Just delete it
                if(newSched.state === 'deleted' || newSection[0] === 'NaN' || newSpot[0] === 'NaN') {
                    if(!oldSpot) {
                        newSched.schedule[i][1].splice(j, 1);
                    } else {
                        historyArr.push({
                            effectedId: oldSpot[3],
                            affectorId: userId,
                            relatedOrg: newSched.newSched,
                            fromTo: [oldSpot, "null", newSched.id],
                            code: 10,
                            date: new Date()
                        });
                        if(newSched.state !== 'deleted' && newSection[0] !== 'NaN' && newSpot[0] === 'NaN') newSched.schedule[i][1].splice(j, 1);
                    }
                } else if(!oldSpot || !oldSpot[3] || oldSpot[3] !== newSpot[3]) {
                    if(oldSpot && oldSpot[3] && oldSpot[3] !== newSpot[3]) {
                        historyArr.push({ //removed spot
                            effectedId: oldSpot[3],
                            affectorId: userId,
                            relatedOrg: oldSched.groupId,
                            fromTo: [oldSpot, null, newSched.id],
                            code: 10,
                            date: new Date()
                        });
                    }
                    historyArr.push({ //new spot
                        effectedId: newSpot[3],
                        affectorId: userId,
                        relatedOrg: newSched.groupId,
                        fromTo: [null, newSpot, newSched.id],
                        code: 10,
                        date: new Date()
                    });
                }
                else if(newSpot[0] !== oldSpot[0] || newSpot[1] !== oldSpot[1] || newSpot[2] !== oldSpot[2]) {
                    //TODO check if spots have changed
                    historyArr.push({ //new spot
                        effectedId: newSpot[3],
                        affectorId: userId,
                        relatedOrg: newSched.groupId,
                        fromTo: [null, newSpot, newSched.id],
                        code: 10,
                        date: new Date()
                    });
                }
                else {
                    if (oldSpot[4]) newSpot[4] = true;
                }
            }
            
            //Checks if a section has been deleted after the spots were notified of being removed.
            if (newSched.state === 'deleted' || newSection[0] === 'NaN') {
                if(!oldSection) {
                    newSched.schedule.splice(i, 1);
                } else {
                    historyArr.push({
                        affectorId: params.userId,
                        relatedOrg: newSched.groupId,
                        fromTo: [oldSection[0], null, newSched.id],
                        code: 13,
                        date: new Date()
                    });
                    newSched.schedule.splice(i, 1);
                }
            } else if(!oldSection || oldSection[0] !== newSection[0]){
            //section name changed on schedule
                historyArr.push({
                    affectorId: userId,
                    relatedOrg: newSched.groupId,
                    fromTo: [
                        (oldSection && oldSection[0] ? oldSection[0] : null),
                        newSection[0],
                        newSched.id
                    ],
                    code: 13,
                    date: new Date()
                });
            }
        }
        
        if (newSched.schedule.length === 0) {
            newSched.schedule = [
                ['Removed']
            ];
            // historyArr.push({
            //     affectorId: userId,
            //     relatedOrg: ctx.args.data.groupId,
            //     fromTo: [ctx.args.data.state, 'deleted', ctx.args.data.id],
            //     code: 11,
            //     date: new Date()
            // });
            newSched.state = 'deleted';
        }
        callback(0, historyArr);
    }
    
        
    Schedule.beforeRemote('find', function(context, instance, next) {
        checkMemsUsers("member", {
            "where": {
                "memberId": context.req.accessToken.userId,
                "orgId": context.args.filter.where.groupId
            }
        }, function(err, res) {
            if(err) return next(err);
            next();
        });
    });

    //User can only get it's own inputs
    Schedule.beforeRemote('findOne', function(context, instance, next) {
        checkMemsUsers("member", {
            "where": {
                "memberId": context.req.accessToken.userId,
                "orgId": context.args.filter.where.groupId
            }
        }, function(err, res) {
            if(err) return next(err);
            next();
        });
    });

    Schedule.afterRemote('findOne', function(ctx, res, cb) {
        var History = Schedule.app.models.History;
        var userId = ctx.req.accessToken.userId;
        var didChange = false;
        for (var i = res.__data.schedule.length - 1; i >= 0; i--) {
            for (var j = 1; j < res.__data.schedule[i].length; j++) {
                for (var k = res.__data.schedule[i][j].length - 1; k >= 0; k--) {
                    if (res.__data.schedule[i][j][k][3] === userId && !res.__data.schedule[i][j][k][4] && res.__data.state !== "saved") {
                        res.__data.schedule[i][j][k][4] = true;
                        didChange = true;
                        //get original sched and check this is not already seen
                        
                        
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
            if (ctx.args.data.state === 'published') {
                histArr.push({
                    affectorId: ctx.req.accessToken.userId,
                    relatedOrg: ctx.args.data.groupId,
                    fromTo: [null, ctx.args.data.state],
                    code: 11,
                    date: new Date()
                });
                for (var i = ctx.args.data.schedule.length - 1; i >= 0; i--) {
                    for (var j = ctx.args.data.schedule[i].length - 1; j > 0; j--) {
                        for (var k = ctx.args.data.schedule[i][j].length - 1; k >= 0; k--) {
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
            }
            History.upsert(histArr);
            next();
        }
        else {
            next();
        }
    });

    
    //should catch "put" methods
    Schedule.beforeRemote('upsert', function(ctx, something, next) {
        var userId = ctx.req.accessToken.userId;
        var Members = Schedule.app.models.Members;
        var History = Schedule.app.models.History;
        // var temp = {
        //     "schedule": [
        //         ["Maze", [
        //             ["Maze Maze", "1970-01-02T02:00:00.000Z", "1970-01-02T07:00:00.000Z", "57b23732f64c0f9d579e054f"],
        //             ["Drums", "1970-01-02T02:00:00.000Z", "1970-01-02T07:00:00.000Z", "57b23840f64c0f9d579e0553"],
        //             ["Bags", "1970-01-02T02:00:00.000Z", "1970-01-02T02:00:00.000Z", "57b23889f64c0f9d579e0557"]
        //         ]],
        //         ["Bus", [
        //             ["Seat #1", "1970-01-02T02:00:00.000Z", "1970-01-02T07:00:00.000Z", "57b238adf64c0f9d579e055b"],
        //             ["Seat #5", "1970-01-02T02:00:00.000Z", "1970-01-02T02:00:00.000Z", "57b23c60f64c0f9d579e055f"],
        //             ["Sparker", "1970-01-02T02:00:00.000Z", "1970-01-02T02:00:00.000Z", "57b23d3cf64c0f9d579e0563"]
        //         ]],
        //         ["Rovers", [
        //             ["Line", "1970-01-02T01:30:00.000Z", "1970-01-02T07:00:00.000Z", "57b23e53f64c0f9d579e0577"],
        //             ["Trail", "1970-01-02T02:30:00.000Z", "1970-01-02T07:30:00.000Z", "57b23602f64c0f9d579e054c", true]
        //         ]],
        //         ["Stand By", [
        //             ["1st", "1970-01-02T02:00:00.000Z", "", "57b23dcef64c0f9d579e056b"],
        //             ["2nd", "1970-01-02T02:00:00.000Z", "", "57b23df9f64c0f9d579e056f"]
        //         ]]
        //     ],
        // }
        
        
        checkMemsUsers("admin", {
            "where": {
                "memberId": userId,
                "orgId": ctx.args.data.groupId
            }
        }, function(chkErr, chkRes) {
            if(chkErr) return next(chkErr);
            checkValidity(ctx.args.data.schedule, function(err, res) {
                if(err) return next(err);
                
                if (!ctx.args.data.id) {
                    handleNewSched();
                } else {
                    Schedule.findOne({
                        where: {
                            id: ctx.args.data.id
                        }
                    }, function(findErr, findRes) {
                        // finalSteps();
                        if(findErr) return next(findErr);
                        if(!findRes || ctx.args.data.state === "saved") {
                            handleNewSched();
                        } else {
                            trackChanges({
                                userId: userId,
                                newSched: ctx.args.data,
                                oldSched: findRes.__data
                            }, function(trackErr, trackRes) {
                                if(trackErr) return next(trackErr);
                                History.upsert(trackRes);
                                next();
                            });
                        }
                    });
                }
            });
        });
        

        function handleNewSched() {
            //brand new schedule in here, the hook will catch history to use the schedule's id
            for (var i = ctx.args.data.schedule.length - 1; i >= 0; i--) {
                if (ctx.args.data.schedule[i][0] === 'NaN') {
                    //if a section is removed, this gets rid of it
                    ctx.args.data.schedule.splice(i, 1);
                }
                else {
                    for (var j = ctx.args.data.schedule[i].length - 1; j > 0; j--) {
                        for (var k = ctx.args.data.schedule[i][j].length - 1; k >= 0; k--) {
                            if (ctx.args.data.schedule[i][j][k][0] === 'NaN') {
                                //if a spot is removed, this gets rid of it
                                ctx.args.data.schedule[i][j].splice(k, 1);
                            }
                            else {
                                //since this code is only ran for "new" schedules, any spots
                                //marked as "seen" will be removed
                                ctx.args.data.schedule[i][j][k].splice(4, 1);
                            }
                        }
                    }
                }
            }
            next();
        }

    });
};
