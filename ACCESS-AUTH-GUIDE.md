# Access Database Authentication Guide

## Connection String Examples

### 1. No Authentication (Open Database)
```
Provider=Microsoft.Jet.OLEDB.4.0;Data Source=C:\path\to\database.mdb;
```

### 2. User-Level Security (.mdb files)
```
Provider=Microsoft.Jet.OLEDB.4.0;Data Source=C:\path\to\database.mdb;User Id=username;Password=userpass;
```

### 3. Database Password (.mdb files)
```
Provider=Microsoft.Jet.OLEDB.4.0;Data Source=C:\path\to\database.mdb;Jet OLEDB:Database Password=dbpass;
```

### 4. Workgroup Security (.mdb files)
```
Provider=Microsoft.Jet.OLEDB.4.0;Data Source=C:\path\to\database.mdb;Jet OLEDB:System Database=C:\path\to\workgroup.mdw;User Id=username;Password=userpass;
```

### 5. Access 2007+ (.accdb files) - No Password
```
Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\path\to\database.accdb;
```

### 6. Access 2007+ (.accdb files) - With Password
```
Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\path\to\database.accdb;Jet OLEDB:Database Password=dbpass;
```

## Test Commands

### Test with batch command:
```cmd
# Test successful connection
execute.cmd query test-access-noauth.txt

# Test bad credentials
execute.cmd query test-access-badauth.txt

# Test bad database password
execute.cmd query test-access-baddbpass.txt

# Test non-existent file
execute.cmd query test-access-nofile.txt
```

### Test with PowerShell:
```powershell
# Run individual test
.\execute.ps1 -Command query -InputFile test-access-badauth.txt

# Run all authentication tests
.\test-auth.ps1
```

### Test with Node.js:
```javascript
node examples/auth-error-handling.js
```

## Common Authentication Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Could not find installable ISAM" | Wrong provider or missing drivers | Install correct Access drivers, check provider name |
| "Cannot open database" | File permissions/corruption | Check file exists, verify permissions, test file integrity |
| "Not a valid password" | Wrong database password | Verify password, check encoding |
| "Could not find file" | Missing database file | Check file path, verify file exists |
| "Logon failed" | Bad user credentials | Verify username/password, check user permissions |
| "Workgroup information file is missing" | Missing .mdw file | Specify correct workgroup file path |

## Error Handling Best Practices

1. **Always use try-catch blocks** around database operations
2. **Parse error messages** to determine the specific issue
3. **Provide user-friendly error messages** instead of technical details
4. **Log detailed errors** for debugging while showing simple messages to users
5. **Don't retry authentication failures** (permanent errors)
6. **Use exponential backoff** for transient connection issues
7. **Validate connection strings** before attempting connections
8. **Test with various scenarios** during development

## Security Considerations

- **Never hardcode passwords** in source code
- **Use environment variables** or secure configuration files
- **Encrypt connection strings** in configuration
- **Use least-privilege accounts** for database access
- **Consider using Windows authentication** when possible
- **Regularly rotate passwords** and update connection strings
- **Monitor failed authentication attempts** for security purposes

## Testing Scenarios to Cover

1. ✅ Valid credentials (should succeed)
2. ✅ Invalid username (should fail gracefully)
3. ✅ Invalid password (should fail gracefully)
4. ✅ Invalid database password (should fail gracefully)
5. ✅ Non-existent database file (should fail gracefully)
6. ✅ Missing database drivers (should fail gracefully)
7. ✅ File permission issues (should fail gracefully)
8. ✅ Network connectivity issues (should retry appropriately)
