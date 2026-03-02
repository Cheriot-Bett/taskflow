// Compatibility shim - routes destructure from this
const dbModule = require('./db');
module.exports = {
  prepare: dbModule.prepare,
  exec: dbModule.exec,
  transaction: dbModule.transaction,
};
