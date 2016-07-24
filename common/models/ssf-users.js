module.exports = function(SsfUsers) {

    SsfUsers.observe('after save', function(ctx, next) {
        if(ctx.isNewInstance === true) {
            var instance = ctx.instance;
            instance.createAccessToken(1209600000, function(err, response) { 
                if(err === null) {
                    ctx.instance["token"] = response.id;
                }
                next();
            });
        } else {
             next();
        }
    });
    SsfUsers.beforeRemote('*.updateAttributes', function(context, instance, next) {
        var History = SsfUsers.app.models.History;
        checkUsers(context.req.accessToken.userId);
        function checkUsers(userId) {
            SsfUsers.findOne({"where":{"id": userId}}, function(userErr, userRes) {
                if(userErr)
                    return next(userErr);
                if(!userRes) {
                    var err = new Error("Unauthorized to perform this action");
                    err.status = 401;
                    next(err);
                } else {
                    testLogin(userRes.__data.email, context.args.data.oldPassword || context.args.data.password, userRes);
                }
            });
        }
        function testLogin(email, password, currentUser) {
            SsfUsers.login({email: email, password: password}, function(loginErr, loginRes) {
                if(loginErr)
                    return next(loginErr);
                if(!context.args.data.oldPassword) delete context.args.data.password;
                delete context.args.data.oldPassword;
                for(var i in context.args.data) {
                    if(i !== 'firstName' && i !== 'password' && i !== 'lastName' && i !== 'email' && i !== 'cellphone')
                        delete context.args.data[i];
                }
                if(currentUser.__data.firstName !== context.args.data.firstName) {
                    History.create({
                        effectedId: context.req.accessToken.userId,
                        affectorId: context.req.accessToken.userId,
                        fromTo: [
                            currentUser.__data.firstName,
                            context.args.data.firstName
                        ],
                        code: 2,
                        date: new Date()
                    });
                }
                if(currentUser.__data.lastName !== context.args.data.lastName) {
                    History.create({
                        effectedId: context.req.accessToken.userId,
                        affectorId: context.req.accessToken.userId,
                        fromTo: [
                            currentUser.__data.lastName,
                            context.args.data.lastName
                        ],
                        code: 3,
                        date: new Date()
                    })
                }
                if(currentUser.__data.email !== context.args.data.email) {
                    History.create({
                        effectedId: context.req.accessToken.userId,
                        affectorId: context.req.accessToken.userId,
                        fromTo: [
                            currentUser.__data.email,
                            context.args.data.email
                        ],
                        code: 2,
                        date: new Date()
                    })
                }
                if(currentUser.__data.cellphone !== context.args.data.cellphone) {
                    History.create({
                        effectedId: context.req.accessToken.userId,
                        affectorId: context.req.accessToken.userId,
                        fromTo: [
                            currentUser.__data.cellphone,
                            context.args.data.cellphone
                        ],
                        code: 1,
                        date: new Date()
                    })
                }
                next();
            });
        }
    });
};
