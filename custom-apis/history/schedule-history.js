var async = require('async');
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
        // var tz = req.query.filter.where.tz;
        // var tz = 'America/Los_Angeles';
        var testTz = req.query.filter.where.tz * 1000 * 60;
        // console.log(testTz);
        
        //TODO: check if the user has permissions
        req.query.filter = {
          where:{},
          order: 'date DESC'
        };
        req.query.filter.where.or = [{
          otherInfo: schedId
        }, {
          fromTo: schedId
        }];
        History.find(req.query.filter, function(err, response) {
            if (err) return cb(err);
            var resArr = [];
            var membersObj = {};
            // var first = true;
            function getDateString(time, params, less) {
              // if(first) {
              //   console.log(new Date(
              //     time
              //   ).getTime() - testTz);
              //   first = false;
              // }
              return new Date(
                new Date(
                  time
                ).getTime() - testTz - (less ? 1000 * 60 * 60 : 0)
              ).toLocaleString(undefined, params);
            }
            async.forEachOf(response, function(k, index, next) {
              if(k.__data.effectedId || k.__data.affectorId) {
                var tempOr = [];
                if(k.__data.effectedId && !membersObj[k.__data.effectedId]) tempOr.push({id: k.__data.effectedId});
                if(k.__data.affectorId && !membersObj[k.__data.affectorId]) tempOr.push({id: k.__data.affectorId});
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
              // if(!res) return cb(0, []);
              for(var i in response) {
                switch(response[i].__data.code) {
                  case '9':
                    resArr.push('The date was changed from "' +
                    getDateString(response[i].__data.fromTo[0], {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long'}) + 
                    "\" to \"" +
                    getDateString(response[i].__data.fromTo[1], {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long'}) + 
                    '" by ' +
                    membersObj[response[i].__data.affectorId].firstName + 
                    " " +
                    membersObj[response[i].__data.affectorId].lastName +
                    " on " +
                    getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                    "."
                    );
                    break;
                  case '10':
                    if(!response[i].__data.fromTo[0] || 'null' === response[i].__data.fromTo[0]) {
                      if(!response[i].__data.effectedId) break;
                      resArr.push(membersObj[response[i].__data.effectedId].firstName + 
                      " " +
                      membersObj[response[i].__data.effectedId].lastName + 
                      " was assigned to \"" + 
                      response[i].__data.fromTo[1][0] + 
                      "\" from " + 
                      getDateString(response[i].__data.fromTo[1][1], {hour: '2-digit', minute: '2-digit'}, true) + 
                      " - " +
                      getDateString(response[i].__data.fromTo[1][2], {hour: '2-digit', minute: '2-digit'}, true) + 
                      '" by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      " on " +
                      getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                      "."
                      );
                    } else if(!response[i].__data.fromTo[1] || 'null' === response[i].__data.fromTo[1]) {
                      if(!response[i].__data.effectedId) break;
                      resArr.push(membersObj[response[i].__data.effectedId].firstName +
                      " " +
                      membersObj[response[i].__data.effectedId].lastName + 
                      " was removed from \"" + response[i].__data.fromTo[0][0] + 
                      "\" during " + 
                      getDateString(response[i].__data.fromTo[0][1], {hour: '2-digit', minute: '2-digit'}, true) + 
                      " - " + 
                      getDateString(response[i].__data.fromTo[0][2], {hour: '2-digit', minute: '2-digit'}, true) + 
                      ' by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      " on " +
                      getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                      "."
                      );
                    } else {
                      if(!response[i].__data.effectedId) break;
                      resArr.push(membersObj[response[i].__data.effectedId].firstName +
                      " " +
                      membersObj[response[i].__data.effectedId].lastName +
                      " was moved from \"" +
                      response[i].__data.fromTo[0][0] +
                      "\" during " + 
                      getDateString(response[i].__data.fromTo[0][1], {hour: '2-digit', minute: '2-digit'}, true) + 
                      " - " +
                      getDateString(response[i].__data.fromTo[0][2], {hour: '2-digit', minute: '2-digit'}, true) + 
                      ' to "' + 
                      response[i].__data.fromTo[1][0] + 
                      '" from ' + 
                      getDateString(response[i].__data.fromTo[1][1], {hour: '2-digit', minute: '2-digit'}, true) + 
                      " - " + 
                      getDateString(response[i].__data.fromTo[1][2], {hour: '2-digit', minute: '2-digit'}, true) + 
                      '" by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      " on " +
                      getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                      "."
                      );
                    }
                    break;
                  case '11':
                    if(!response[i].__data.fromTo[0] || 'null' === response[i].__data.fromTo[0]) {
                      //created
                      resArr.push('The schedule was "' +
                      response[i].__data.fromTo[1] + 
                      '" by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      " on " +
                      getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                      "."
                      );
                    } else if(!response[i].__data.fromTo[1] || 'null' === response[i].__data.fromTo[1]) {
                      //deleted
                      resArr.push('The schedule was "' +
                      response[i].__data.fromTo[1] + 
                      '" by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      " on " +
                      getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                      "."
                      );
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
                      " on " +
                      getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                      "."
                      );
                    }
                    break;
                  case '12':
                    resArr.push(membersObj[response[i].__data.affectorId].firstName +
                    " " +
                    membersObj[response[i].__data.affectorId].lastName +
                    ' saw their job at "' +
                    response[i].__data.fromTo[1][0] +
                    "\" from " +
                    getDateString(response[i].__data.fromTo[1][1], {hour: '2-digit', minute: '2-digit'}, true) +
                    " - " +
                    getDateString(response[i].__data.fromTo[1][2], {hour: '2-digit', minute: '2-digit'}, true) +
                    " on " +
                    getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                    '.');
                    break;
                  case '13':
                    //section changed
                    if(!response[i].__data.fromTo[0] || 'null' === response[i].__data.fromTo[0]) {
                      resArr.push('The section "' +
                      response[i].__data.fromTo[1] +
                      '" was created by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      " on " +
                      getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                      "."
                      );
                    } else if(!response[i].__data.fromTo[1] || 'null' === response[i].__data.fromTo[1]) {
                      resArr.push('The section "' +
                      response[i].__data.fromTo[0] +
                      '" was deleted by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      " on " +
                      getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                      "."
                      );
                    } else {
                      resArr.push('The section name was changed from "' +
                      response[i].__data.fromTo[0] + 
                      "\" to \"" +
                      response[i].__data.fromTo[1] + 
                      '" by ' +
                      membersObj[response[i].__data.affectorId].firstName +
                      " " +
                      membersObj[response[i].__data.affectorId].lastName +
                      " on " +
                      getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                      "."
                      );
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
                    membersObj[response[i].__data.affectorId].lastName +
                    " on " +
                    getDateString(response[i].__data.date, {year: 'numeric', month: 'short', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit'}) +
                    "."
                    );
                    break;
                  default:
                    resArr.push(response[i].__data);
                }
              }
              cb(0, resArr);
            });
        });
    };
};