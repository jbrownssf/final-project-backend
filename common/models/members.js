var getStatuses = require('../../custom-apis/members/get-status.js');
var getRequests = require('../../custom-apis/members/get-requests.js');

module.exports = function(Members) {
    getStatuses(Members);
    getRequests(Members);
};
