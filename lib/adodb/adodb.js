/**
 * @module adodb
 * @license MIT
 * @version 2017/11/09
 */

import { free, stdout, stdoutError, fillRecords, fillArrays } from './utils';

/**
 * @namespace ADODB
 */
export var ADODB = {
  /**
   * @method execute
   * @param {Object} params
   * @returns {Array}
   */
  execute: function (params) {
    var recordset;
    var result = [];
    var scalarMode = !!params.scalar;
    var connection = new ActiveXObject('ADODB.Connection');

    if (scalarMode) {
      recordset = new ActiveXObject('ADODB.Recordset');
    }

    // Set CursorLocation
    connection.CursorLocation = 3;

    try {
      // Open
      connection.Open(params.connection);
      // Execute
      connection.Execute(params.sql);

      // Scalar
      if (scalarMode) {
        recordset.Open(params.scalar, connection, 0, 1);

        // fill records
        result = fillRecords(recordset).ResultSet;
      }

      // Write data
      stdout(result);
    } catch (error) {
      stdoutError(error);
    }

    // Close database
    free(connection);
    scalarMode && free(recordset);
  },
  /**
  * @method transaction
  * @param {Object} params
  * @returns {Array}
  */
  transaction: function (params) {
    var connection = new ActiveXObject('ADODB.Connection');

    // Set CursorLocation
    connection.CursorLocation = 3;

    try {
      // Open
      connection.Open(params.connection);
      connection.BeginTrans();
      // Execute
      for (i = 0; i < params.sql.length; i++)
        connection.Execute(params.sql[i]);

    } catch (error) {
      connection.RollbackTrans(),
        stdoutError(error);
    }
    connection.CommitTrans();
    stdout([]);
    // Close database
    free(connection);
  },
  /**
   * This will return the results formatted the same way the
   * old version worked for backward compatibility. Essentially
   * it's going to use the bRetArray == false process. Except
   * the new return value is a typed record<> structure and
   * all I need to return is the inner RecordSet array of
   * records.
   * @method query
   * @param {Object} params
   * @returns {Array}
   */
  query: function (params) {
    var connection = new ActiveXObject('ADODB.Connection');
    var recordset = new ActiveXObject('ADODB.Recordset');
    // Set CursorLocation
    connection.CursorLocation = 3;
    try {
      // Open
      connection.Open(params.connection);
      // Query
      recordset.Open(params.sql, connection, 0, 1);

      // Write data
      // The new fillRecords method returns the newer record
      // structure, but I need to only return the inner
      // RecordSet array.
      stdout(fillRecords(recordset).ResultSet);
    }
    catch (error) {
      stdoutError(error);
    }

    // Close database
    free(recordset);
    free(connection);
  },
  /**
   * This will return the results in the new data structure. The record has
   * a type indicator which will reflect the bRetArray value. When bRetArray
   * === false, the RecordSet will be the old style array of records. Each
   * record is a map-like structure that corresponds to the column names as
   * the key, and the column value corresponds to the value of that
   * @method query_v2
   * @param {Object} params
   * @param bRetArray boolean
   * @returns {type: bRetArray, RecordSet: <depends on bRetArray>}
   */
  query_v2: function (params) {
    var connection = new ActiveXObject('ADODB.Connection');
    var recordset = new ActiveXObject('ADODB.Recordset');
    // Set CursorLocation
    connection.CursorLocation = 3;

    try {
      // Open
      connection.Open(params.connection);
      // Query
      recordset.Open(params.sql, connection, 0, 1);

      // Write data
      if (params.FetchArrays) {
        stdout(fillArrays(recordset));
      }
      else {
        stdout(fillRecords(recordset));
      }
    }
    catch (error) {
      stdoutError(error);
    }

    // Close database
    free(recordset);
    free(connection);
  },
  /**
   * @method schema
   * @param {Object} params
   * @returns {Array}
   */
  schema: function (params) {
    var recordset;
    var connection = new ActiveXObject('ADODB.Connection');

    // Set CursorLocation
    connection.CursorLocation = 3;

    try {
      // Open
      connection.Open(params.connection);

      // OpenSchema
      if (params.hasOwnProperty('id')) {
        recordset = connection.OpenSchema(params.type, params.criteria, params.id);
      } else if (params.hasOwnProperty('criteria')) {
        recordset = connection.OpenSchema(params.type, params.criteria);
      } else {
        recordset = connection.OpenSchema(params.type);
      }

      // Write data
      stdout(fillRecords(recordset).ResultSet);
    } catch (error) {
      stdoutError(error);
    }

    // Close database
    free(recordset);
    free(connection);
  }
};
