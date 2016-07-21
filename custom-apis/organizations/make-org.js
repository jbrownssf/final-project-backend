module.exports = function(Organizations) {
    Organizations.remoteMethod('makeOrg', {
        http: {
            path: '/makeOrg',
            verb: 'POST'
        },
        accepts: [{
            arg: 'req',
            type: 'object',
            'http': {
                source: 'req'
            }
        }, {
            arg: 'email',
            required: true,
            type: 'string',
            description: 'The user\'s email for the owner of the organization.'
        }, {
            arg: 'name',
            required: true,
            type: 'string',
            description: 'The name of the Organization. Cannot be the same as an existing Organization.'
        }, {
            arg: 'nickName',
            required: false,
            type: 'string',
            description: 'An optional nick name of the Organization\'s owner.'
        }],
        // notes: "If you pass in the 'requestId' you do not need the other two fields.",
        description: "Creates an Organization and ties a user to it as the owner.",
        returns: {
            type: 'object',
            root: true
        }
    });
    Organizations.makeOrg = function(req, email, name, nickName, cb) {
        var Members = Organizations.app.models.Members;
        var SSFUsers = Organizations.app.models.SSFUsers;
        var johnsId = req.accessToken.userId;
        //checks if the id requested exists or not
        if(johnsId !== '57906392bfc0e40877eab465') {
          var err = new Error("To create a new organization, you need to be the owner. Contact John Brown at john.p.brown@outlook.com for participating in this app.");
          err.statusCode = 500;
          return cb(err);
        }
        SSFUsers.findOne({
            where: {
                email: email
            }
        }, function(reqFindErr, reqFindRes) {
            if (reqFindErr || !reqFindRes) {
              var err = new Error('The specified owner does not exist.');
              err.statusCode = 500;
              return cb(reqFindErr ? reqFindErr : err);
            }
            Organizations.find({
              where: {
                name: name
              }
            }, function(findOrgErr, findOrgRes) {
              if(findOrgErr || findOrgRes.length !== 0) {
                var err = new Error('Organization name already exists.');
                err.statusCode = 500;
                return cb(findOrgErr ? findOrgErr : err);
              }
              
              //Name not in use, keep going
              Organizations.create({
                name: name,
                ownerId: reqFindRes.__data.id,
                status: 'open'
              }, function(createOrgErr, createOrgRes) {
                if(createOrgErr)
                  return cb(createOrgErr);
                Members.create({
                  memberId: reqFindRes.__data.id,
                  status: 'owner',
                  orgId: createOrgRes.__data.id,
                  nickName: nickName
                }, function(createMemErr, createMemRes) {
                  if(createMemErr)
                    return cb(createMemErr);
                  cb(0, 'Created the organization and tied the owner to it.');
                  
                })
              })
            })
        });
    };
};