/**
 * @module main
 * @license MIT
 * @version 2017/11/09
 */

import './json';
import { ADODB } from './adodb';

// Command
var command = WScript.Arguments(0);
// Wait stdin
var params;
try {
    params = JSON.parse(WScript.StdIn.ReadAll());
} catch (e) {
    // Write error to stderr so Node.js can capture it
    WScript.StdErr.Write(JSON.stringify({
        code: -2147024809, // Generic invalid argument error code
        message: 'JSON Parse Error: ' + e.message
    }));
    WScript.Quit(3); // Exit with code 3 (Internal JavaScript Parse Error)
}

// Main
try {
    if (!ADODB[command]) {
        throw new Error('Unknown command: ' + command);
    }
    ADODB[command](params);
} catch (e) {
    // Handle script-level errors (not ADODB errors)
    WScript.StdErr.Write(JSON.stringify({
        code: e.number || -2147024894, // Use error number if available, otherwise generic error
        message: 'Script Error: ' + (e.message || e.description || e)
    }));
    WScript.Quit(5); // Exit with code 5 (Fatal Error)
}
