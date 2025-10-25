'use strict';

/**
 * Example: Graceful Authentication Error Handling
 *
 * This example demonstrates how to handle various authentication
 * errors when connecting to Access databases.
 */

const ADODB = require('../');

/**
 * Test different authentication scenarios
 */
async function testAuthenticationScenarios() {
    console.log('='.repeat(60));
    console.log('Access Database Authentication Error Handling Demo');
    console.log('='.repeat(60));
    console.log('');

    const testCases = [
        {
            name: 'Valid Connection (No Auth)',
            connection: 'Provider=Microsoft.Jet.OLEDB.4.0;Data Source=node-adodb.mdb;',
            expectSuccess: true
        },
        {
            name: 'Bad User Credentials',
            connection: 'Provider=Microsoft.Jet.OLEDB.4.0;Data Source=node-adodb.mdb;User Id=baduser;Password=wrongpass;',
            expectSuccess: false
        },
        {
            name: 'Bad Database Password',
            connection: 'Provider=Microsoft.Jet.OLEDB.4.0;Data Source=node-adodb.mdb;Jet OLEDB:Database Password=wrongpassword;',
            expectSuccess: false
        },
        {
            name: 'Non-existent Database',
            connection: 'Provider=Microsoft.Jet.OLEDB.4.0;Data Source=nonexistent.mdb;',
            expectSuccess: false
        },
        {
            name: 'Invalid Provider',
            connection: 'Provider=InvalidProvider;Data Source=node-adodb.mdb;',
            expectSuccess: false
        }
    ];

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\nTest ${i + 1}: ${testCase.name}`);
        console.log('-'.repeat(50));

        try {
            // Attempt to open connection
            const db = ADODB.open(testCase.connection);

            // Try to execute a simple query
            const result = await db.query('SELECT COUNT(*) as RecordCount FROM Users');

            if (testCase.expectSuccess) {
                console.log('✓ SUCCESS: Connection established and query executed');
                console.log(`  Result: ${JSON.stringify(result, null, 2)}`);
            } else {
                console.log('⚠ UNEXPECTED: Expected failure but got success');
                console.log(`  Result: ${JSON.stringify(result, null, 2)}`);
            }

        } catch (error) {
            if (testCase.expectSuccess) {
                console.log('✗ UNEXPECTED FAILURE: Expected success but got error');
            } else {
                console.log('✓ EXPECTED FAILURE: Caught authentication error');
            }

            // Parse and categorize the error
            const errorInfo = parseAuthenticationError(error);
            console.log(`  Error Type: ${errorInfo.type}`);
            console.log(`  User Message: ${errorInfo.userMessage}`);
            console.log(`  Technical Details: ${errorInfo.technicalDetails}`);

            if (errorInfo.suggestions.length > 0) {
                console.log('  Suggestions:');
                errorInfo.suggestions.forEach(suggestion => {
                    console.log(`    • ${suggestion}`);
                });
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Authentication testing completed');
    console.log('='.repeat(60));
}

/**
 * Parse authentication errors and provide user-friendly information
 * @param {Error} error - The error object from ADODB
 * @returns {Object} Parsed error information
 */
function parseAuthenticationError(error) {
    const errorMessage = error.message || error.toString();
    const processError = error.process || {};

    // Common error patterns and their meanings
    const errorPatterns = [
        {
            pattern: /could not find installable isam/i,
            type: 'Provider Error',
            userMessage: 'Database driver not installed or incorrect file format',
            suggestions: [
                'Verify the correct database provider is installed',
                'Check if the database file format matches the provider',
                'Try using Microsoft.ACE.OLEDB.12.0 for newer Access files'
            ]
        },
        {
            pattern: /cannot open database/i,
            type: 'Database Access Error',
            userMessage: 'Cannot access the database file',
            suggestions: [
                'Check if the database file exists',
                'Verify file permissions',
                'Ensure the database is not corrupted',
                'Make sure no other process has exclusive access'
            ]
        },
        {
            pattern: /not a valid password/i,
            type: 'Password Error',
            userMessage: 'Incorrect database password',
            suggestions: [
                'Verify the database password is correct',
                'Check if the database requires a password',
                'Ensure proper password encoding in connection string'
            ]
        },
        {
            pattern: /could not find file/i,
            type: 'File Not Found',
            userMessage: 'Database file not found',
            suggestions: [
                'Check if the file path is correct',
                'Verify the file exists at the specified location',
                'Use absolute paths to avoid path resolution issues'
            ]
        },
        {
            pattern: /workgroup information file/i,
            type: 'Workgroup Security Error',
            userMessage: 'Workgroup security configuration issue',
            suggestions: [
                'Specify the correct workgroup file (.mdw)',
                'Verify user permissions in the workgroup',
                'Check workgroup file accessibility'
            ]
        },
        {
            pattern: /logon failed/i,
            type: 'Authentication Failed',
            userMessage: 'Invalid username or password',
            suggestions: [
                'Verify the username and password are correct',
                'Check if the user account exists',
                'Ensure the user has database access permissions'
            ]
        }
    ];

    // Find matching error pattern
    let matchedPattern = errorPatterns.find(pattern =>
        pattern.pattern.test(errorMessage)
    );

    // If no specific pattern matches, provide generic info
    if (!matchedPattern) {
        matchedPattern = {
            type: 'Unknown Database Error',
            userMessage: 'An unexpected database error occurred',
            suggestions: [
                'Check the connection string format',
                'Verify all connection parameters',
                'Check application logs for more details'
            ]
        };
    }

    return {
        type: matchedPattern.type,
        userMessage: matchedPattern.userMessage,
        technicalDetails: errorMessage,
        suggestions: matchedPattern.suggestions,
        originalError: error,
        exitCode: error.exitCode,
        processError: processError
    };
}

/**
 * Example function showing how to implement robust error handling
 * in your application
 */
async function robustDatabaseConnection(connectionString, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Connection attempt ${attempt}/${maxRetries}...`);

            const db = ADODB.open(connectionString);

            // Test the connection with a simple query
            await db.query('SELECT 1 as TestQuery');

            console.log('✓ Database connection successful');
            return db;

        } catch (error) {
            lastError = error;
            const errorInfo = parseAuthenticationError(error);

            console.log(`✗ Attempt ${attempt} failed: ${errorInfo.userMessage}`);

            // Don't retry for certain error types
            if (errorInfo.type === 'Password Error' ||
                errorInfo.type === 'Authentication Failed' ||
                errorInfo.type === 'File Not Found') {
                console.log('  → Not retrying (permanent error)');
                break;
            }

            if (attempt < maxRetries) {
                const delay = attempt * 1000; // Exponential backoff
                console.log(`  → Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All attempts failed
    throw lastError;
}

// Run the authentication tests if this file is executed directly
if (require.main === module) {
    testAuthenticationScenarios()
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

// Export functions for use in other modules
module.exports = {
    testAuthenticationScenarios,
    parseAuthenticationError,
    robustDatabaseConnection
};
