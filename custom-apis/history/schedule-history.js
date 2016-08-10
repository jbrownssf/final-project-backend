var async = require('async');
var moment = require('moment-timezone');
module.exports = function(History) {
    History.remoteMethod('schedHistory', {
        http: {
            path: '/schedHistory',
            verb: 'GET'
        },
        // notes: "If you pass in the 'requestId' you do not need the other two fields.",
        description: "Returns changes to a specific schedule.",
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
    History.schedHistory = function(req, res, cb) {
        var SSFUsers = History.app.models.SSFUsers;
        if(!req.query.filter.where.schedId) {
          var tempErr = new Error('Please send a schedId within the filter of the url.');
          tempErr.statusCode = 500;
          return cb(tempErr);
        } else if(!req.query.filter.where.tz) {
          var tempError = new Error('Please send a "tz" within the filter of the url.');
          tempError.statusCode = 500;
          return cb(tempError);
        }
        var schedId = req.query.filter.where.schedId;
        var tz = req.query.filter.where.tz;
        //TODO: check if the user has permissions
        req.query.filter = {where:{}};
        req.query.filter.where.or = [{
          otherInfo: schedId
        }, {
          fromTo: schedId
        }];
        History.find(req.query.filter, function(err, response) {
            if (err) return cb(err);
            
            //new Date(moment.tz(response[0].__data.date, "America/Los_Angeles").format()).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'});
            //new Date(moment.tz(date, tz).format()).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'});
              
              
            
            
            var resArr = [];
            var membersObj = {};
            async.forEachOf(response, function(k, index, next) {
              if(k.__data.effectedId || k.__data.affectorId) {
                var tempOr = [];
                if(!membersObj[k.__data.effectedId]) tempOr.push({id: k.__data.effectedId});
                if(!membersObj[k.__data.affectorId]) tempOr.push({id: k.__data.affectorId});
                SSFUsers.find({where:{or: tempOr}}, function(findErr, findRes) {
                  if(findErr) {
                    next(findErr);
                  } else {
                    for(var j in findRes) {
                      membersObj[findRes[j].id] = {
                        firstName: findRes[j].firstName,
                        lastName: findRes[j].lastName
                      };
                    }
                    next();
                  }
                });
              } else {
                next();
              }
            }, function(err, res) {
              for(var i in response) {
                switch(response[i].__data.code) {
                  case '9':
                    resArr.push('The date was changed from "' +
                    new Date(moment.tz(response[i].__data.fromTo[0], tz).format()).toLocaleString(undefined, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long'}) + 
                    "\" to \"" +
                    new Date(Date.parse(response[i].__data.fromTo[1])).toLocaleString(undefined, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long'}) + 
                    '" by ' +
                    membersObj[response[i].__data.affectorId].firstName + 
                    " " +
                    membersObj[response[i].__data.affectorId].lastName);
                    break;
                  case '10':
                    if(!response[i].__data.fromTo[0]) {
                      resArr.push(membersObj[response[i].__data.effectedId].firstName + 
                      " " +
                      membersObj[response[i].__data.effectedId].lastName + 
                      " was assigned to \"" + 
                      response[i].__data.fromTo[1][0] + 
                      "\" from " + 
                      new Date(Date.parse(response[i].__data.fromTo[1][1])).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'}) + 
                      " - " 
                      + new Date(Date.parse(response[i].__data.fromTo[1][2])).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'}) + 
                      '" by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      '.');
                    } else if(!response[i].__data.fromTo[1]) {
                      resArr.push(membersObj[response[i].__data.effectedId].firstName +
                      " " +
                      membersObj[response[i].__data.effectedId].lastName + 
                      " was removed from \"" + response[i].__data.fromTo[0][0] + 
                      "\" during " + 
                      new Date(Date.parse(response[i].__data.fromTo[0][1])).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'}) + 
                      " - " + 
                      new Date(Date.parse(response[i].__data.fromTo[0][2])).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'}) + 
                      ' by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      '.');
                    } else {
                      resArr.push(membersObj[response[i].__data.effectedId].firstName +
                      " " +
                      membersObj[response[i].__data.effectedId].lastName + 
                      " was moved from \"" + 
                      response[i].__data.fromTo[0][0] + 
                      "\" during " + 
                      new Date(Date.parse(response[i].__data.fromTo[0][1])).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'}) + 
                      " - " +
                      new Date(Date.parse(response[i].__data.fromTo[0][2])).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'}) + 
                      ' to "' + 
                      response[i].__data.fromTo[1][0] + 
                      '" from ' + 
                      new Date(Date.parse(response[i].__data.fromTo[1][1])).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'}) + 
                      " - " + 
                      new Date(Date.parse(response[i].__data.fromTo[1][2])).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'}) + 
                      '" by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName);
                    }// resArr.push('A spot was changed.');
                    break;
                  case '11':
                    // resArr.push('The schedule status was changed.');
                    if(!response[i].__data.fromTo[0]) {
                      //created
                      resArr.push('The schedule was "' +
                      response[i].__data.fromTo[1] + 
                      '" by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      ".");
                    } else if(!response[i].__data.fromTo[1]) {
                      //deleted
                      resArr.push('The schedule was "' +
                      response[i].__data.fromTo[1] + 
                      '" by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      ".");
                    } else {
                      //changed
                      resArr.push('The schedule was changed from "' +
                      response[i].__data.fromTo[0] + 
                      "\" to \"" +
                      response[i].__data.fromTo[1] + 
                      '" by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      ".");
                    }
                    break;
                  case '12':
                    resArr.push(membersObj[response[i].__data.affectorId].firstName +
                    " " +
                    membersObj[response[i].__data.affectorId].lastName +
                    ' saw their spot at "' +
                    response[i].__data.fromTo[1][0] +
                    "\" from " +
                    new Date(Date.parse(response[i].__data.fromTo[1][1])).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'}) +
                    " - " +
                    new Date(Date.parse(response[i].__data.fromTo[1][2])).toLocaleString(undefined, {hour: '2-digit', minute: '2-digit'}) +
                    " on " +
                    new Date(Date.parse(response[i].__data.date)).toLocaleString(undefined, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                    '.');
                    break;
                  case '13':
                    if(!response[i].__data.fromTo[0]) {
                      resArr.push('The section "' +
                      response[i].__data.fromTo[1] +
                      '" was created by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      '.');
                    } else if(!response[i].__data.fromTo[1]) {
                      resArr.push('The section "' +
                      response[i].__data.fromTo[0] +
                      '" was deleted by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      '.');
                    } else {
                      resArr.push('The section name was changed from "' +
                      response[i].__data.fromTo[0] + 
                      "\" to \"" +
                      response[i].__data.fromTo[1] + 
                      '" by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      '.');
                    }
                    break;
                  case '14':
                    resArr.push('The note was changed from "' +
                    response[i].__data.fromTo[0] + 
                    "\" to \"" +
                    response[i].__data.fromTo[1] + 
                    '" by ' +
                    membersObj[response[i].__data.affectorId].firstName +
                    " " +
                    membersObj[response[i].__data.affectorId].lastName);
                    break;
                  default:
                    resArr.push(response[i].__data);
                }
              }
              cb(0, resArr);
            });
            // History.findOne({
            //     where: {
            //         memberId: req.accessToken.userId,
            //         orgId: req.query.filter.where.orgId
            //     }
            // }, function(findErr, findRes) {
            //     if (findErr) return cb(findErr);
            //     if(!findRes) {
            //         var newErr = new Error('You are not already a member.');
            //         newErr.statusCode = 503;
            //         return cb(newErr);
            //     }
            //     async.forEachOf(response, function(index, i, next) {
            //             SSFUsers.findOne({
            //                 where: {
            //                     id: index.memberId
            //                 }
            //             }, function(memberErr, memberRes) {
            //                 if (memberErr) {
            //                     next(memberErr);
            //                 }
            //                 else {
            //                     //any member of the company can see this
            //                     response[i].firstName = memberRes.firstName;
            //                     response[i].lastName = memberRes.lastName;

            //                     //only owners/admins can see this
            //                     if (findRes.__data.status === 'admin' || findRes.__data.status === 'owner' || memberRes.__data.id.toString() === req.accessToken.userId) {
            //                         response[i].email = memberRes.email;
            //                         response[i].cellphone = memberRes.cellphone;
            //                         // response[i].address = memberRes.address; // ???
            //                     }
            //                     next();
            //                 }
            //             });
            //         },
            //         function(err) {
            //             if (err) {
            //                 var error = new Error('async.forEach operation failed');
            //                 error.statusCode = 500;
            //                 cb(error);
            //             }
            //             cb(0, response);
            //         });
            // });
        });
    };
};