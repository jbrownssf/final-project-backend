var schedHistory = require('../../custom-apis/history/schedule-history.js');
module.exports = function(History) {
  schedHistory(History);
};



// History.create({
//     effectedId: '',
//     affectorId: '',
//     relatedOrg: '',
//     fromTo: '',
//     code: '',
//     date: new Date()
// });