/**
 * @module utils
 * @license MIT
 * @version 2017/11/09
 */

import './json';

/**
 * @function free
 * @description Free connection
 * @param {Object} connection
 */
export function free(connection) {
  connection.State && connection.Close();
}

/**
 * @function stdout
 * @param {any} data
 */
export function stdout(data) {
  WScript.StdOut.Write(JSON.stringify(data));
}

/**
 * @function stderr
 * @param {any} data
 */
function stderr(data) {
  WScript.StdErr.Write(JSON.stringify(data));
}

/**
 * @function stdoutError
 * @param {Error} error
 */
export function stdoutError(error) {
  var code = error.number;
  var message = error.description;

  if (!message) {
    message = 'Unspecified error, SQL may contain reserved words and symbols, surround it with brackets []';
  }

  // Write out error
  stderr({ code: code, message: message });
  
  // Exit with appropriate code based on error type
  var exitCode = getExitCodeForError(code);
  WScript.Quit(exitCode);
}

/**
 * @function getExitCodeForError
 * @param {number} errorCode - The ADODB error code
 * @returns {number} - Appropriate exit code
 */
function getExitCodeForError(errorCode) {
  // Authentication/Access errors
  if (errorCode === -2147217843 ||  // Login failed
      errorCode === -2147024891 ||  // Access denied
      errorCode === -2147467259) {  // Unspecified error (often auth)
    return 9; // Invalid Argument (closest match for auth failure)
  }
  
  // Connection/Driver errors
  if (errorCode === -2147217900 ||  // Could not find installable ISAM
      errorCode === -2147467262) {  // Connection failed
    return 6; // Non-function Internal Exception Handler (connection issues)
  }
  
  // SQL/Query errors
  if (errorCode === -2147217904 ||  // No value given for parameter
      errorCode === -2147217887 ||  // Wrong type
      errorCode === -2147217865) {  // Item not found in collection
    return 4; // Internal JavaScript Evaluation Failure (bad SQL)
  }
  
  // Default for other ADODB errors
  return 10; // Internal JavaScript Run-Time Failure
}

/**
 * @function trimString
 * @param {string} str
 * @returns {string}
 */
function trimString(str) {
  // Check if the input is a string. If not, return it as-is.
  if (typeof str !== 'string') {
    return str;
  }

  // The regular expression `^\s+|\s+$` matches one or more whitespace characters
  // at the beginning (`^`) of the string or (`|`) at the end (`$`).
  // The global 'g' flag ensures it matches both occurrences.
  return str.replace(/^\s+|\s+$/g, '');
}

/**
 * @function isDate
 * @param {number} type
 * @returns {boolean}
 * @see https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/datatypeenum
 */
function isDate(type) {
  return type === 7 || type === 64 || type === 133 || type === 134 || type === 135;
}

/**
 * @function isBinary
 * @param {number} type
 * @returns {boolean}
 * @see https://docs.microsoft.com/en-us/sql/ado/reference/ado-api/datatypeenum
 */
function isBinary(type) {
  return type === 128 || type === 204 || type === 205;
}

/**
 * @function readBinary
 * @param {Binary} binary
 * @returns {string}
 */
function readBinary(binary) {
  var stream = new ActiveXObject('ADODB.Stream');

  stream.Type = 1;

  stream.Open();

  stream.Position = 0;

  stream.Write(binary);

  stream.Position = 0;
  stream.Type = 2;

  var text = stream.ReadText();

  free(stream);

  return text;
}

/**
 * @function fillRecords
 * @param {Recordset} recordset
 * @returns {Array}
 */
export function fillRecords(recordset) {
  var retRecord = {
    type: false,
    ResultSet: []
  }
  var fields = recordset.Fields;

  // Not empty
  if (!recordset.BOF || !recordset.EOF) {
    var i, record;
    var field, type, value;
    var count = fields.Count;

    recordset.MoveFirst();

    while (!recordset.EOF) {
      record = {};

      for (i = 0; i < count; i++) {
        field = fields.Item(i);
        type = field.Type;
        value = field.Value;

        // ADO has given us a UTC date but JScript assumes it's a local timezone date
        // Thanks https://github.com/Antony74
        if (isDate(type)) {
          value = new Date(value);
        } else if (isBinary(type)) {
          value = readBinary(value);
        }

        record[field.Name] = value;
      }

      retRecord.ResultSet.push(record);
      recordset.MoveNext();
    }
  }
  // Return records
  return retRecord;
}

/**
 * @function fillArrays
 * @param {Recordset} recordset
 * @returns {ResultSet}
 */
export function fillArrays(recordset) {
  var i;
  var fields = recordset.Fields;
  var count = fields.Count;
  var retRecord =
  {
    type: true,
    ResultSet: {
      FieldMetaData: {
        FieldNames: [],
        FieldTypes: []
      },
      ResultSet: []
    }
  }

  // Not empty
  if (!recordset.BOF || !recordset.EOF) {

    recordset.MoveFirst();
    for (i = 0; i < count; i++) {
      retRecord.ResultSet.FieldMetaData.FieldNames.push(fields.Item(i).Name);
      retRecord.ResultSet.FieldMetaData.FieldTypes.push(fields.Item(i).Type);
    }

    while (!recordset.EOF) {
      var record = [];

      for (i = 0; i < count; i++) {
        var field = fields.Item(i);
        var type = field.type;

        // ADO has given us a UTC date but JScript assumes it's a local timezone date
        // Thanks https://github.com/Antony74
        if (isDate(type)) {
          record.push(new Date(field.value));
        }
        else if (isBinary(type)) {
          record.push(readBinary(field.value));
        }
        else if (typeof field.value === 'string') {
          record.push(trimString(field.value));
        }
        else record.push(field.value);
      };

      retRecord.ResultSet.ResultSet.push(record);
      recordset.MoveNext();
    }
  }

  // Return records
  return retRecord;
}
