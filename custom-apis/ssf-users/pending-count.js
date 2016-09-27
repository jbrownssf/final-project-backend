var async = require('async');
module.exports = function(SSFUsers) {
  SSFUsers.remoteMethod('getBadges', {
        http: {
            path: '/getBadges',
            verb: 'GET'
        },
        // notes: "If you pass in the 'requestId' you do not need the other two fields.",
        description: "Gets an object of all of the notifications for the app related to the user who makes the call.",
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
  SSFUsers.getBadges = function(req, res, cb) {
    var Members = SSFUsers.app.models.Members;
    var userId = req.accessToken.userId;
    var Schedule = SSFUsers.app.models.Schedule;
    var returnObj = {};
    //returnObj formatting:
    /*{
      orgId1: {
        pending: 4,
        sched1: true, //means it has not been seen and is the user's spot
        sched3: true
      },
      orgId2: {
        pending: 1,
        sched1: true,
        sched3: true
      },
      orgId3: {
        pending: 0,
        sched1: true,
        sched3: true
      }
    }*/
    getMembership();
    
    function getMembership() {
      Members.find({
        where: {
          memberId: userId
        }
      }, function(findErr, findRes) {
        if(findErr) return cb(findErr);
        asyncCall(findRes);
      });
    }
    
    function asyncCall(array) {
      async.forEachOf(array, function(item, index, next) {
        getNewSchedules(item.orgId, item.status, next);
        
      }, function(err, res) {
        //end of loop
        if(err) return cb(err);
        cb(0, returnObj);
      });
    }
    
    function getNewSchedules(orgId, memberType, next) {
      Schedule.find({
        where: {
          groupId: orgId,
          state: 'published'
          // schedule: userId
        },
        // limit: 2
      }, function(findErr, findRes) {
        if(findErr) return next(findErr);
        var tempObj = {};
        var count = 0;
        for(var i = 0; i < findRes.length; i++) {
          for(var j = 0; j < findRes[i].__data.schedule.length; j++) {
            // console.log(findRes[i].__data.schedule[j]);
            for(var k = 1; k < findRes[i].__data.schedule[j].length; k++) {
              // console.log(findRes[i].__data.schedule[j][k]);
              for(var l = 0; l < findRes[i].__data.schedule[j][k].length; l++) {
                // console.log(findRes[i].__data.schedule[j][k][l]);
                if(findRes[i].__data.schedule[j][k][l][3] === userId) {
                  if(!returnObj[orgId]) returnObj[orgId] = {};
                  returnObj[orgId][findRes[i].__data.id] = findRes[i].__data.schedule[j][k][l][4] || false;
                  if(!returnObj[orgId][findRes[i].__data.id]) count++;
                }
              }
            }
          }
        }
        
        if(!returnObj[orgId]) returnObj[orgId] = {};
        returnObj[orgId].unseenCount = count;
        // console.log(returnObj);
        
        if(memberType === "admin" || memberType === "owner") {
          getPendingMembersCount(orgId, next);
        } else {
          next();
        }
      });
    }
    
    function getPendingMembersCount(orgId, next) {
      Members.find({
        where: {
          orgId: orgId,
          status: 'pending'
        }
      }, function(findErr, findRes) {
        if(findErr) return next(findErr);
        returnObj[orgId].pendingCount = findRes.length;
        next();
      });
    }
  };
  
};