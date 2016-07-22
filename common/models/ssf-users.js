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
                    testLogin(userRes.__data.email, context.args.data.password);
                }
            });
        }
        function testLogin(email, password) {
            SsfUsers.login({email: email, password: password}, function(loginErr, loginRes) {
                if(loginErr)
                    return next(loginErr);
                delete context.args.data.oldPassword;
                for(var i in context.args.data) {
                    if(i !== 'firstName' && i !== 'lastName' && i !== 'email' && i !== 'cellphone')
                        delete context.args.data[i];
                }
                next();
            });
        }
    });
};
